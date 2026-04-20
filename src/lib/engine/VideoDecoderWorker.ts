/// <reference lib="webworker" />

import { FrameBufferManager } from './FrameBuffer';
import MP4Box from 'mp4box';

type Milliseconds = number & { readonly __brand: 'ms' };

const ctx: Worker = self as any;

let mp4boxFile: any;
let videoTrack: any;
let decoder: VideoDecoder | null = null;
let frameBuffer: FrameBufferManager | null = null;

let samples: any[] = [];
let activeLoadId = 0;
let pendingSeekMs: Milliseconds | null = null;

let currentSeekId = 0;
let seekTargetTimestamp = 0;
let seekFrameTotal = 0;
let seekFrameDecoded = 0;

ctx.onmessage = async (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      console.log(`[DecoderWorker] INIT received for file: ${payload.file.name}`);
      activeLoadId++;
      currentSeekId = 0;
      if (payload.sharedBuffer) {
        frameBuffer = new FrameBufferManager(payload.sharedBuffer);
      }
      await initFile(payload.file, activeLoadId);
      break;

    case 'SEEK':
      seekTo(payload.time as Milliseconds, payload.seekId);
      break;

    default:
      console.warn('[DecoderWorker] Unknown message type:', type);
  }
};

async function initFile(file: File, loadId: number) {
  samples = [];
  pendingSeekMs = null;

  if (decoder) {
    decoder.close();
    decoder = null;
  }

  // @ts-ignore
  mp4boxFile = MP4Box.createFile();

  mp4boxFile.onReady = (info: any) => {
    console.log(`[DecoderWorker] MP4Box onReady triggered. Tracks: ${info.videoTracks.length}`);
    videoTrack = info.videoTracks[0];
    if (!videoTrack) {
      console.error('[DecoderWorker] No video track found in file.');
      return;
    }
    
    // Update dimensions in the SharedArrayBuffer header
    if (frameBuffer) {
      frameBuffer.setDimensions(videoTrack.video.width, videoTrack.video.height);
    }

    ctx.postMessage({ type: 'READY', payload: { track: videoTrack } });
    mp4boxFile.setExtractionOptions(videoTrack.id, null, { nbSamples: 1000 });
    console.log(`[DecoderWorker] Starting extraction for track ${videoTrack.id}`);
    mp4boxFile.start();
  };

  mp4boxFile.onSamples = (_id: number, _user: any, fetchedSamples: any[]) => {
    console.log(`[DecoderWorker] MP4Box onSamples: received ${fetchedSamples.length} new samples`);
    for (let i = 0; i < fetchedSamples.length; i++) {
      samples.push(fetchedSamples[i]);
    }
    ctx.postMessage({ type: 'INDEXED', payload: { count: samples.length } });

    if (pendingSeekMs !== null) {
      const t = pendingSeekMs;
      pendingSeekMs = null;
      queueMicrotask(() => seekTo(t));
    }
  };

  mp4boxFile.onError = (e: any) => {
    console.error('[DecoderWorker] MP4Box Error:', e);
  };

  console.log('[DecoderWorker] Starting file stream read loop...');
  const reader = file.stream().getReader();
  let offset = 0;
  while (true) {
    if (loadId !== activeLoadId) {
      reader.cancel();
      return;
    }
    const { done, value } = await reader.read();
    if (done) break;

    try {
      const chunk = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
      (chunk as any).fileStart = offset;
      mp4boxFile.appendBuffer(chunk);
      offset += value.byteLength;
    } catch (err) {
      console.error('[DecoderWorker] Append error:', err);
      break;
    }
  }

  console.log('[DecoderWorker] File read loop complete. Calling flush().');
  mp4boxFile.flush();
}

async function seekTo(timeMs: Milliseconds, requestSeekId?: number) {
  const seekId = requestSeekId ?? ++currentSeekId;
  currentSeekId = seekId; // Keep internal counter in sync
  console.log(`[DecoderWorker] [${seekId}] SEEK received for ${timeMs}ms`);
  
  if (!videoTrack || samples.length === 0) {
    console.log(`[DecoderWorker] [${seekId}] SEEK deferred: track ready=${!!videoTrack}, samples=${samples.length}`);
    pendingSeekMs = timeMs;
    return;
  }

  const timescale = videoTrack.timescale;
  const targetCts = (timeMs / 1000) * timescale;

  let targetIndex = 0;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].cts > targetCts) break;
    targetIndex = i;
  }

  seekTargetTimestamp = Math.round(samples[targetIndex].cts * (1000000 / timescale));

  if (frameBuffer) {
    frameBuffer.clear(); // Clear old frames from previous scrub
  }

  let keyIndex = targetIndex;
  while (keyIndex > 0 && !samples[keyIndex].is_sync) {
    keyIndex--;
  }
  
  if (seekId !== currentSeekId) return;
  console.log(`[DecoderWorker] [${seekId}] Found target frame at index ${targetIndex}, keyframe at index ${keyIndex}`);

  // macOS VideoToolbox Stall Fix:
  // VideoDecoder.reset() is known to cause severe latency spikes (500ms+) on mac.
  // Closing and recreating the decoder is much faster and completely clears the hardware queue.
  if (decoder) {
    try { decoder.close(); } catch (_) {}
    decoder = null;
  }
  
  ensureDecoder();

  seekFrameTotal = targetIndex - keyIndex + 1;
  seekFrameDecoded = 0;

  // Start decoding from keyframe to target
  for (let i = keyIndex; i <= targetIndex; i++) {
    if (seekId !== currentSeekId) break;
    const s = samples[i];
    decoder?.decode(new EncodedVideoChunk({
      type: s.is_sync ? 'key' : 'delta',
      timestamp: s.cts * (1000000 / timescale),
      duration: s.duration * (1000000 / timescale),
      data: s.data
    }));
  }

  // Pre-buffer logic (reduced to 30 frames to limit CPU saturation on scrub)
  const prebufferCount = 30;
  for (let i = targetIndex + 1; i < Math.min(samples.length, targetIndex + 1 + prebufferCount); i++) {
    if (seekId !== currentSeekId) break;
    const s = samples[i];
    decoder?.decode(new EncodedVideoChunk({
      type: s.is_sync ? 'key' : 'delta',
      timestamp: s.cts * (1000000 / timescale),
      duration: s.duration * (1000000 / timescale),
      data: s.data
    }));
  }

  if (seekId === currentSeekId) {
    try {
      await decoder?.flush();
    } catch (err) {
      if (seekId === currentSeekId) {
        console.error(`[DecoderWorker] [${seekId}] Flush error:`, err);
      }
    }
  }
}

function ensureDecoder() {
  if (decoder) return;

  decoder = new VideoDecoder({
    output: (frame) => {
      // Use a tolerance threshold or integer rounding because WebCodecs casts timestamps to integers internally, 
      // whereas JS float multiplication introduces decimals.
      const timestampMs = Math.round(frame.timestamp);
      const targetMs = Math.round(seekTargetTimestamp);
      
      // Discard intermediate delta frames that are only needed to reconstruct the target frame
      // We allow a small 10us tolerance just in case of rounding divergence
      if (timestampMs < targetMs - 10) {
        frame.close();
        return;
      }

      const isTarget = Math.abs(timestampMs - targetMs) <= 10;

      if (frameBuffer) {
        const writeIndex = frameBuffer.reserveWriteSlot();
        if (writeIndex !== null) {
          const pixels = frameBuffer.getWriteBuffer(writeIndex);
          if (pixels) {
            const frameTimeMs = (frame.timestamp / 1000) as Milliseconds;
            frame.copyTo(pixels, { format: 'RGBA' }).then(() => {
              frameBuffer?.commitWrite(frameTimeMs);
              
              if (isTarget) {
                ctx.postMessage({ type: 'TARGET_READY', payload: { timeMs: frameTimeMs, index: writeIndex, seekId: currentSeekId } });
              } else {
                ctx.postMessage({ type: 'PREBUFFERED', payload: {} }); // Just an update, UI doesn't render it
              }
              frame.close();
            }).catch((err) => {
              console.error(`[DecoderWorker] [${currentSeekId}] copyTo error:`, err);
              frame.close();
            });
            return;
          }
        }
      }

      // If buffer is full or missing, only fallback to ImageBitmap for the target frame (don't flood UI)
      if (isTarget) {
        createImageBitmap(frame).then(bitmap => {
          ctx.postMessage({ type: 'FRAME', payload: { bitmap, timeMs: (frame.timestamp / 1000) } }, [bitmap]);
          frame.close();
        });
      } else {
        frame.close();
      }
    },
    error: (e) => console.error(`[DecoderWorker] Global Decode error:`, e)
  });

  configureDecoder();
}

function configureDecoder() {
  if (!decoder || !videoTrack) return;
  decoder.configure({
    codec: videoTrack.codec,
    codedWidth: videoTrack.video.width,
    codedHeight: videoTrack.video.height,
    description: getExtraData(mp4boxFile)
  });
}

let cachedExtraData: Uint8Array | null = null;

/** Extract AVC/HEVC/VP9 codec configuration from the MP4 container. */
function getExtraData(file: any) {
  if (cachedExtraData) return cachedExtraData;

  const track = file.getTrackById(videoTrack.id);
  for (const entry of track.mdia.minf.stbl.stsd.entries) {
    if (entry.avcC || entry.hvcC || entry.vpcC) {
      const box = entry.avcC || entry.hvcC || entry.vpcC;
      const stream = new (MP4Box as any).DataStream(undefined, 0, (MP4Box as any).DataStream.BIG_ENDIAN);
      box.write(stream);
      cachedExtraData = new Uint8Array(stream.buffer, 8); // Skip box header
      return cachedExtraData;
    }
  }
  return null;
}
