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

class EngineService {
  private static instance: EngineService;
  private worker: Worker | null = null;
  private onFrameCallback: ((bitmap: ImageBitmap) => void) | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Initialize the decoder worker
      this.worker = new Worker(new URL('./VideoDecoderWorker.ts', import.meta.url));
      
      this.worker.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === 'FRAME' && this.onFrameCallback) {
          this.onFrameCallback(payload.bitmap);
        }
      };
    }
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
    this.worker?.postMessage({ type: 'INIT', payload: { file } });
  }

  /**
   * Requests a frame at a specific time.
   */
  public seek(timeMs: number) {
    this.worker?.postMessage({ type: 'SEEK', payload: { time: timeMs } });
  }

  /**
   * Register a callback for when a new frame is decoded.
   */
  public onFrame(callback: (bitmap: ImageBitmap) => void) {
    this.onFrameCallback = callback;
  }

  // Placeholder methods for UI compatibility during transition
  public getStats() { return { status: 'decoding', version: '0.1.0' }; }
  public render(index: number) { return null; }
  public async init() { return Promise.resolve(); }
}

export const engine = EngineService.getInstance();
