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

let seekFrameTotal = 0;
let seekFrameDecoded = 0;

ctx.onmessage = async (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      console.log(`[DecoderWorker] INIT received for file: ${payload.file.name}`);
      activeLoadId++;
      if (payload.sharedBuffer) {
        frameBuffer = new FrameBufferManager(payload.sharedBuffer);
      }
      await initFile(payload.file, activeLoadId);
      break;

    case 'SEEK':
      await seekTo(payload.time as Milliseconds);
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

async function seekTo(timeMs: Milliseconds) {
  console.log(`[DecoderWorker] SEEK received for ${timeMs}ms`);
  
  if (!videoTrack || samples.length === 0) {
    console.log(`[DecoderWorker] SEEK deferred: track ready=${!!videoTrack}, samples=${samples.length}`);
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

  let keyIndex = targetIndex;
  while (keyIndex > 0 && !samples[keyIndex].is_sync) {
    keyIndex--;
  }
  
  console.log(`[DecoderWorker] Found target frame at index ${targetIndex}, keyframe at index ${keyIndex}`);

  if (decoder) {
    decoder.close();
    decoder = null;
  }

  seekFrameTotal = targetIndex - keyIndex + 1;
  seekFrameDecoded = 0;

  decoder = new VideoDecoder({
    output: (frame) => {
      seekFrameDecoded++;
      console.log(`[DecoderWorker] Decoded frame ${seekFrameDecoded}/${seekFrameTotal}`);

      if (seekFrameDecoded === seekFrameTotal) {
        console.log(`[DecoderWorker] Emitting target frame for ${timeMs}ms`);

        if (frameBuffer) {
          const writeIndex = frameBuffer.getWriteIndex();
          if (writeIndex !== null) {
            const pixels = frameBuffer.getFrameAt(timeMs);
            if (pixels) {
              frame.copyTo(pixels).then(() => {
                frameBuffer?.commitWrite(timeMs);
                ctx.postMessage({ type: 'BUFFER_READY', payload: { timeMs, index: writeIndex } });
                frame.close();
              });
              return;
            }
          }
        }

        // Fallback to legacy ImageBitmap if no buffer or buffer full
        createImageBitmap(frame).then(bitmap => {
          ctx.postMessage({ type: 'FRAME', payload: { bitmap, timeMs } }, [bitmap]);
          frame.close();
        });
      } else {
        frame.close();
      }
    },
    error: (e) => console.error('[DecoderWorker] Decode error:', e)
  });

  decoder.configure({
    codec: videoTrack.codec,
    codedWidth: videoTrack.video.width,
    codedHeight: videoTrack.video.height,
    description: getExtraData(mp4boxFile)
  });

  for (let i = keyIndex; i <= targetIndex; i++) {
    const s = samples[i];
    decoder.decode(new EncodedVideoChunk({
      type: s.is_sync ? 'key' : 'delta',
      timestamp: s.cts * (1000000 / timescale),
      duration: s.duration * (1000000 / timescale),
      data: s.data
    }));
  }

  try {
    await decoder.flush();
  } catch (err) {
    console.error('[DecoderWorker] Flush error:', err);
  }
}

/** Extract AVC/HEVC/VP9 codec configuration from the MP4 container. */
function getExtraData(file: any) {
  const track = file.getTrackById(videoTrack.id);
  for (const entry of track.mdia.minf.stbl.stsd.entries) {
    if (entry.avcC || entry.hvcC || entry.vpcC) {
      const box = entry.avcC || entry.hvcC || entry.vpcC;
      const stream = new (MP4Box as any).DataStream(undefined, 0, (MP4Box as any).DataStream.BIG_ENDIAN);
      box.write(stream);
      return new Uint8Array(stream.buffer, 8);
    }
  }
  return null;
}
