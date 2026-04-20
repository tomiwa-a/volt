/// <reference lib="webworker" />
/// <reference lib="webworker" />

const ctx: Worker = self as any;

importScripts('https://unpkg.com/mp4box@0.5.2/dist/mp4box.all.js');

let mp4boxFile: any;
let videoTrack: any;
let decoder: VideoDecoder | null = null;
let currentFile: File | null = null;

let samples: any[] = [];

ctx.onmessage = async (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      await initFile(payload.file);
      break;

    case 'SEEK':
      await seekTo(payload.time);
      break;

    default:
      console.warn('[DecoderWorker] Unknown message type:', type);
  }
};

async function initFile(file: File) {
  currentFile = file;
  
  // @ts-ignore - MP4Box is global from importScripts
  mp4boxFile = MP4Box.createFile();

  mp4boxFile.onReady = (info: any) => {
    videoTrack = info.videoTracks[0];
    ctx.postMessage({ type: 'READY', payload: { track: videoTrack } });
    
    mp4boxFile.setExtractionConfig(videoTrack.id, null, {
      strategy: 'all'
    });
    mp4boxFile.start();
  };

  mp4boxFile.onSamples = (id: number, user: any, fetchedSamples: any[]) => {
    samples = fetchedSamples;
    ctx.postMessage({ type: 'INDEXED', payload: { count: samples.length } });
  };

  const reader = file.stream().getReader();
  let offset = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const buffer = value.buffer as any;
    buffer.fileStart = offset;
    mp4boxFile.appendBuffer(buffer);
    offset += value.length;
  }
}

async function seekTo(timeMs: number) {
  if (!videoTrack || samples.length === 0) return;

  const timescale = videoTrack.timescale;
  const targetCts = (timeMs / 1000) * timescale;

  let bestSample = samples[0];
  for (const s of samples) {
    if (s.cts <= targetCts) {
      bestSample = s;
    } else {
      break;
    }
  }

  // Initialize decoder if needed
  if (!decoder) {
    decoder = new VideoDecoder({
      output: (frame) => {
        createImageBitmap(frame).then(bitmap => {
          ctx.postMessage({ type: 'FRAME', payload: { bitmap, timeMs } }, [bitmap]);
          frame.close();
        });
      },
      error: (e) => console.error('[DecoderWorker] Decode error:', e)
    });

    const config = {
      codec: videoTrack.codec,
      codedWidth: videoTrack.video.width,
      codedHeight: videoTrack.video.height,
      description: getExtraData(mp4boxFile)
    };
    
    decoder.configure(config);
  }

  // To seek correctly in H.264, we ideally need to find the previous KeyFrame (I-Frame)
  // and decode from there. For now, we'll try a simpler approach.
  const chunk = new EncodedVideoChunk({
    type: bestSample.is_sync ? 'key' : 'delta',
    timestamp: bestSample.cts * (1000000 / timescale), // WebCodecs uses microseconds
    duration: bestSample.duration * (1000000 / timescale),
    data: bestSample.data
  });

  decoder.decode(chunk);
}

// Helper to extract bitstream metadata (AVC configuration)
function getExtraData(file: any) {
  const track = file.getTrackById(videoTrack.id);
  for (const entry of track.mdia.minf.stbl.stsd.entries) {
    if (entry.avcC || entry.hvcC || entry.vpcC) {
      const box = entry.avcC || entry.hvcC || entry.vpcC;
      const stream = new (globalThis as any).DataStream(undefined, 0, (globalThis as any).DataStream.BIG_ENDIAN);
      box.write(stream);
      return new Uint8Array(stream.buffer, 8); // Skip box header
    }
  }
  return null;
}
