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
  private isLoaded = false;
  private go: Go | null = null;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): EngineService {
    if (!EngineService.instance) {
      EngineService.instance = new EngineService();
    }
    return EngineService.instance;
  }

  public async init(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        console.log('[Engine] Loading Go WASM runtime...');

        // 1. Ensure wasm_exec.js is loaded (it should be in public/)
        if (typeof Go === 'undefined') {
          throw new Error('Go runtime (wasm_exec.js) not found. Is it loaded in the document?');
        }

        this.go = new Go();
        const response = await fetch('/engine.wasm');
        const buffer = await response.arrayBuffer();

        console.log('[Engine] Instantiating WASM...');
        const result = await WebAssembly.instantiate(buffer, this.go.importObject);

        // Run the Go program (this will block but the syscalls will be available)
        this.go.run(result.instance);

        this.isLoaded = true;
        console.log('[Engine] Go WASM Bridge established.');
      } catch (error) {
        console.error('[Engine] Failed to initialize WASM engine:', error);
        this.loadPromise = null;
        throw error;
      }
    })();

    return this.loadPromise;
  }

  public getStats() {
    if (!this.isLoaded) return null;
    return window.volt_getStats();
  }

  public render(index: number) {
    if (!this.isLoaded) return null;
    return window.volt_renderFrame(index);
  }
}

export const engine = EngineService.getInstance();
