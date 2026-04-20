/// <reference lib="webworker" />

type Milliseconds = number & { readonly __brand: 'ms' };

const ctx: Worker = self as any;

importScripts('https://unpkg.com/mp4box@0.5.2/dist/mp4box.all.js');

let mp4boxFile: any;
let videoTrack: any;
let decoder: VideoDecoder | null = null;
let currentFile: File | null = null;

let samples: any[] = [];
let activeLoadId = 0;
let pendingSeekMs: Milliseconds | null = null;
let targetTimeMs: Milliseconds | null = null;

ctx.onmessage = async (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      activeLoadId++;
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
  currentFile = file;
  samples = [];
  pendingSeekMs = null;

  if (decoder) {
    decoder.close();
    decoder = null;
  }

  // @ts-ignore - MP4Box is global from importScripts
  mp4boxFile = MP4Box.createFile();

  mp4boxFile.onReady = (info: any) => {
    videoTrack = info.videoTracks[0];
    ctx.postMessage({ type: 'READY', payload: { track: videoTrack } });

    mp4boxFile.setExtractionOptions(videoTrack.id, null, { strategy: 'all' });
    mp4boxFile.start();
  };

  mp4boxFile.onSamples = (id: number, user: any, fetchedSamples: any[]) => {
    samples = fetchedSamples;
    ctx.postMessage({ type: 'INDEXED', payload: { count: samples.length } });

    if (pendingSeekMs !== null) {
      seekTo(pendingSeekMs);
      pendingSeekMs = null;
    }
  };

  mp4boxFile.onError = (e: any) => {
    console.error('[DecoderWorker] MP4Box Error:', e);
  };

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

async function seekTo(timeMs: Milliseconds) {
  if (!videoTrack) return;

  if (samples.length === 0) {
    pendingSeekMs = timeMs;
    return;
  }

  const timescale = videoTrack.timescale;
  const targetCts = (timeMs / 1000) * timescale;
  targetTimeMs = timeMs;

  let targetIndex = 0;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].cts > targetCts) break;
    targetIndex = i;
  }

  let keyIndex = targetIndex;
  while (keyIndex > 0 && !samples[keyIndex].is_sync) {
    keyIndex--;
  }

  // Always reset and reconfigure the decoder before a seek chain to avoid
  // the 'key frame required after configure() or flush()' error.
  if (decoder) {
    decoder.close();
    decoder = null;
  }

  decoder = new VideoDecoder({
    output: (frame) => {
      const frameMs = Math.round(frame.timestamp / 1000) as Milliseconds;
      if (targetTimeMs !== null && Math.abs(frameMs - targetTimeMs) < (1000 / (videoTrack?.timescale ?? 30))) {
        createImageBitmap(frame).then(bitmap => {
          ctx.postMessage({ type: 'FRAME', payload: { bitmap, timeMs: frameMs } }, [bitmap]);
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
}

/** Extract AVC/HEVC/VP9 codec configuration from the MP4 container. */
function getExtraData(file: any) {
  const track = file.getTrackById(videoTrack.id);
  for (const entry of track.mdia.minf.stbl.stsd.entries) {
    if (entry.avcC || entry.hvcC || entry.vpcC) {
      const box = entry.avcC || entry.hvcC || entry.vpcC;
      const stream = new (globalThis as any).DataStream(undefined, 0, (globalThis as any).DataStream.BIG_ENDIAN);
      box.write(stream);
      return new Uint8Array(stream.buffer, 8);
    }
  }
  return null;
}
