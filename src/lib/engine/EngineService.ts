/**
 * EngineService handles the loading and communication with the Go WASM engine.
 */

// Define types for the Go runtime provided by wasm_exec.js
declare class Go {
  importObject: any;
  run(instance: WebAssembly.Instance): Promise<void>;
}

// Extend Window to include our Go-exported functions
declare global {
  interface Window {
    volt_getStats: () => any;
    volt_renderFrame: (index: number) => string;
    volt_processClip: (name: string) => string;
  }
}

import { FrameBufferManager } from './FrameBuffer';
import { telemetry } from './Telemetry';

class EngineService {
  private static instance: EngineService;
  private worker: Worker | null = null;
  private onFrameCallback: ((bitmap: ImageBitmap | Uint8ClampedArray) => void) | null = null;
  private frameBuffer: FrameBufferManager | null = null;
  private activeFileKey: string | null = null;
  private lastSeekId = 0;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initWorker();
    }
  }

  private initWorker() {
    if (typeof window === 'undefined') return;
    this.worker = new Worker(new URL('./VideoDecoderWorker.ts', import.meta.url), { type: 'module' });
    
    this.worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'FRAME' && this.onFrameCallback) {
        telemetry.recordFrameReady(payload.seekId || payload.timeMs);
        this.onFrameCallback(payload.bitmap);
      }
      if (type === 'BUFFER_READY' && this.frameBuffer) {
        // Record telemetry for EVERY frame (keeps monitor alive and accurate)
        telemetry.recordFrameReady(payload.seekId || payload.timeMs);
        telemetry.recordBufferCount(this.frameBuffer.getStats().count);

        // During playback, render every frame. During scrubbing, only render the target.
        const shouldRender = this.isPlaybackActive || payload.isTarget;
        if (shouldRender && this.onFrameCallback) {
          const pixels = this.frameBuffer.getFrameAt(payload.timeMs);
          if (pixels) {
            this.onFrameCallback(pixels);
          }
        }
      }
    };
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isPlaybackActive = false;
    this.activeFileKey = null;
    this.lastSeekId = 0;
    this.frameBuffer?.wipe();
    telemetry.reset();
  }

  public static getInstance(): EngineService {
    if (!EngineService.instance) {
      EngineService.instance = new EngineService();
    }
    return EngineService.instance;
  }

  /**
   * Initializes the decoder for a specific file.
   */
  public async loadFile(file: File) {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (key === this.activeFileKey) return;
    this.activeFileKey = key;

    if (!this.frameBuffer) this.frameBuffer = new FrameBufferManager();
    if (!this.worker) this.initWorker();

    this.worker?.postMessage({ 
      type: 'INIT', 
      payload: { 
        file,
        sharedBuffer: this.frameBuffer?.getBuffer()
      } 
    });
  }

  private isPlaybackActive = false;

  /**
   * Requests a frame at a specific time (for scrubbing only).
   */
  public seek(timeMs: number) {
    const seekId = ++this.lastSeekId;
    telemetry.recordSeek(seekId);
    this.worker?.postMessage({ type: 'SEEK', payload: { time: timeMs, seekId } });
  }

  /**
   * Start continuous playback from a given time.
   */
  public play(timeMs: number, fps: number) {
    this.isPlaybackActive = true;
    this.worker?.postMessage({ type: 'PLAY', payload: { time: timeMs, fps } });
  }

  /**
   * Stop continuous playback.
   */
  public stop() {
    this.isPlaybackActive = false;
    this.worker?.postMessage({ type: 'STOP' });
  }

  /**
   * Register a callback for when a new frame is decoded.
   */
  public onFrame(callback: (bitmap: ImageBitmap | Uint8ClampedArray) => void) {
    this.onFrameCallback = callback;
  }

  // Placeholder methods for UI compatibility during transition
  public getStats() { 
    return { 
      status: 'decoding', 
      version: '0.1.0',
      buffer: this.frameBuffer?.getStats()
    }; 
  }

  public getDimensions() {
    return this.frameBuffer?.getDimensions() || { width: 1920, height: 1080 };
  }
  public render(index: number) { return null; }
  public async init() { return Promise.resolve(); }

}

export const engine = EngineService.getInstance();
