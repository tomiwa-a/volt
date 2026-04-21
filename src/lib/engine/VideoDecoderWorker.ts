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
let lastFoundTargetSeekId = -1;
let lastDecodedIndex = -1;
let isSequentialPlayback = false;

// Continuous playback state
let playbackActive = false;
let playbackIntervalId: any = null;
let playbackCurrentIndex = 0;

ctx.onmessage = async (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      console.log(`[DecoderWorker] INIT received for file: ${payload.file.name}`);
      activeLoadId++;
      currentSeekId = 0;
      lastDecodedIndex = -1;
      playbackActive = false;
      if (playbackIntervalId) { clearInterval(playbackIntervalId); playbackIntervalId = null; }
      if (payload.sharedBuffer) {
        frameBuffer = new FrameBufferManager(payload.sharedBuffer);
      }
      await initFile(payload.file, activeLoadId);
      break;

    case 'SEEK':
      // Scrubbing: stop any active playback first
      if (playbackActive) {
        playbackActive = false;
        if (playbackIntervalId) { clearInterval(playbackIntervalId); playbackIntervalId = null; }
      }
      seekTo(payload.time as Milliseconds, payload.seekId);
      break;

    case 'PLAY':
      startPlayback(payload.time as Milliseconds, payload.fps);
      break;

    case 'STOP':
      playbackActive = false;
      if (playbackIntervalId) { clearInterval(playbackIntervalId); playbackIntervalId = null; }
      break;

    default:
      console.warn('[DecoderWorker] Unknown message type:', type);
  }
};

function startPlayback(startTimeMs: Milliseconds, fps: number) {
  if (!videoTrack || samples.length === 0) return;

  playbackActive = true;
  const timescale = videoTrack.timescale;
  const startCts = (startTimeMs / 1000) * timescale;

  // Find starting sample index
  playbackCurrentIndex = 0;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].cts > startCts) break;
    playbackCurrentIndex = i;
  }

  // Do an initial seek to prime the decoder from the nearest keyframe
  seekTo(startTimeMs);

  const intervalMs = 1000 / fps;

  if (playbackIntervalId) clearInterval(playbackIntervalId);
  playbackIntervalId = setInterval(() => {
    if (!playbackActive || !decoder) {
      clearInterval(playbackIntervalId);
      playbackIntervalId = null;
      return;
    }

    playbackCurrentIndex++;
    if (playbackCurrentIndex >= samples.length) {
      // Reached end of video
      playbackActive = false;
      clearInterval(playbackIntervalId);
      playbackIntervalId = null;
      return;
    }

    const s = samples[playbackCurrentIndex];

    // Feed exactly ONE frame to the decoder per tick
    try {
      decoder?.decode(new EncodedVideoChunk({
        type: s.is_sync ? 'key' : 'delta',
        timestamp: s.cts * (1000000 / timescale),
        duration: s.duration * (1000000 / timescale),
        data: s.data
      }));
      lastDecodedIndex = playbackCurrentIndex;

      // Update the seek target so the output callback knows what's "current"
      seekTargetTimestamp = Math.round(s.cts * (1000000 / timescale));
    } catch (err) {
      console.error('[DecoderWorker] Playback decode error:', err);
    }
  }, intervalMs);
}


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

  mp4boxFile.flush();
}

async function seekTo(timeMs: Milliseconds, requestSeekId?: number) {
  const seekId = requestSeekId ?? ++currentSeekId;
  currentSeekId = seekId; // Keep internal counter in sync
  if (!videoTrack || samples.length === 0) {
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

  let keyIndex = targetIndex;
  while (keyIndex > 0 && !samples[keyIndex].is_sync) {
    keyIndex--;
  }
  
  if (seekId !== currentSeekId) return;

  ensureDecoder();

  // If we are moving sequentially (normal playback or small scrub), avoid a destructive hard reset.
  // During playback, targetIndex is usually ~30 frames BEHIND lastDecodedIndex because of pre-buffering.
  isSequentialPlayback = false;
  let drift = 0;
  if (lastDecodedIndex !== -1) {
    drift = targetIndex - lastDecodedIndex;
    // Sequential if we are within a reasonable window of our current decoder state
    // We are VERY permissive here (10 seconds in either direction)
    if (drift >= -300 && drift <= 300) {
      isSequentialPlayback = true;
    }
  }

  if (!isSequentialPlayback) {
    console.log(`[Volt] HARD RESET Triggered. Drift: ${drift}, Target: ${targetIndex}, Last: ${lastDecodedIndex}`);
    try {
      decoder?.reset();
      configureDecoder();
    } catch (e) {
      console.error(`[DecoderWorker] [${seekId}] Decoder reset/reconfig failed:`, e);
      decoder?.close();
      decoder = null;
      ensureDecoder();
    }
    // Set our baseline to start decoding from the keyframe
    lastDecodedIndex = keyIndex - 1;
  }


  seekFrameTotal = Math.max(0, targetIndex - lastDecodedIndex);
  seekFrameDecoded = 0;

  // Only decode the fresh frames we haven't fed yet.
  const startDecodeIndex = lastDecodedIndex + 1;

  if (startDecodeIndex <= targetIndex) {
    for (let i = startDecodeIndex; i <= targetIndex; i++) {
      // In sequential mode, we DON'T break just because a new seekId arrived.
      // This prevents "starvation" where the decoder never catches up.
      if (!isSequentialPlayback && seekId !== currentSeekId) break;
      
      const s = samples[i];
      decoder?.decode(new EncodedVideoChunk({
        type: s.is_sync ? 'key' : 'delta',
        timestamp: s.cts * (1000000 / timescale),
        duration: s.duration * (1000000 / timescale),
        data: s.data
      }));
      lastDecodedIndex = i;
    }
  }

  // Keep a buffer full to naturally push out the target frame without needing to flush()
  const prebufferCount = 30;
  for (let i = targetIndex + 1; i < Math.min(samples.length, targetIndex + 1 + prebufferCount); i++) {
    // Again, don't interrupt the pre-buffer fill during sequential playback.
    if (!isSequentialPlayback && seekId !== currentSeekId) break;
    
    // Only feed the prebuffer if we haven't already!
    if (i > lastDecodedIndex) {
      const s = samples[i];
      decoder?.decode(new EncodedVideoChunk({
        type: s.is_sync ? 'key' : 'delta',
        timestamp: s.cts * (1000000 / timescale),
        duration: s.duration * (1000000 / timescale),
        data: s.data
      }));
      lastDecodedIndex = i;
    }
  }

  // We DO NOT call decoder?.flush() here!
  // flush() places the decoder into an End-Of-Stream state which strictly requires the NEXT frame 
  // to be a key-frame. If we flush, we cannot feed sequential delta frames on the next tick!
  // The 30-frame prebuffer loop above is plenty to push out the target frame.
}

function ensureDecoder() {
  if (decoder) return;

  decoder = new VideoDecoder({
    output: (frame) => {
      const timestampMs = Math.round(frame.timestamp / 1000);
      const targetMs = Math.round(seekTargetTimestamp / 1000);
      
      // During continuous playback, NEVER discard frames.
      // During scrubbing, only discard frames that are before the seek target.
      if (!playbackActive && !isSequentialPlayback && timestampMs < targetMs - 10) {
        frame.close();
        return;
      }

      // During continuous playback, every frame is a "target" frame.
      let isTarget = playbackActive;
      if (!isTarget && lastFoundTargetSeekId !== currentSeekId) {
          isTarget = true;
          lastFoundTargetSeekId = currentSeekId;
      }

      const requiredSize = timestampMs === targetMs ? 0 : (frame.displayWidth * frame.displayHeight * 4);
      const canFitInBuffer = requiredSize <= FrameBufferManager.FIXED_STRIDE;

      if (frameBuffer && canFitInBuffer) {
        const writeIndex = frameBuffer.reserveWriteSlot();
        if (writeIndex !== null) {
          const pixels = frameBuffer.getWriteBuffer(writeIndex);
          if (pixels) {
            const frameTimeMs = (frame.timestamp / 1000) as Milliseconds;
            frame.copyTo(pixels, { format: 'RGBA' }).then(() => {
              frameBuffer?.commitWrite(writeIndex, frameTimeMs);
              ctx.postMessage({ type: 'BUFFER_READY', payload: { timeMs: frameTimeMs, index: writeIndex, seekId: currentSeekId, isTarget } });
              frame.close();
            }).catch(() => {
              frame.close();
            });
            return;
          }
        }
      }

      // Fallback for overflow (4K) or if buffer is full: Use ImageBitmap (Slower but avoids corruption)
      if (isTarget) {
        createImageBitmap(frame).then(bitmap => {
          ctx.postMessage({ type: 'FRAME', payload: { bitmap, timeMs: (frame.timestamp / 1000), seekId: currentSeekId } }, [bitmap]);
          frame.close();
        });
      } else {
        frame.close();
      }
    },
    error: (e) => console.error(`[DecoderWorker] [${currentSeekId}] Global Decode error:`, e)
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
