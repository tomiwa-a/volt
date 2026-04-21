
/**
 * Metrics tracked by the Volt Monitor.
 */
export interface VoltMetrics {
  decodeLatency: number[]; // Time (ms) from seek to frame ready
  jitter: number[];        // Variance in frame intervals
  bufferCount: number[];   // SAB ring buffer occupancy
  wasmTime: number[];     // Time spent in WASM processing
  jsTime: number[];       // Time spent in JS overhead
}

class TelemetryManager {
  private static instance: TelemetryManager;
  private MAX_SAMPLES = 200;

  private metrics: VoltMetrics = {
    decodeLatency: [],
    jitter: [],
    bufferCount: [],
    wasmTime: [],
    jsTime: [],
  };

  private lastFrameTime = 0;
  private pendingSeeks = new Map<string | number, number>(); 

  private constructor() {}

  public static getInstance(): TelemetryManager {
    if (!TelemetryManager.instance) {
      TelemetryManager.instance = new TelemetryManager();
    }
    return TelemetryManager.instance;
  }

  public reset() {
    this.metrics = {
      decodeLatency: [],
      jitter: [],
      bufferCount: [],
      wasmTime: [],
      jsTime: [],
    };
    this.lastFrameTime = 0;
    this.pendingSeeks.clear();
  }

  public recordSeek(id: string | number) {
    this.pendingSeeks.set(id, performance.now());
  }

  public recordFrameReady(id: string | number) {
    const startTime = this.pendingSeeks.get(id);
    if (startTime) {
      this.addSample('decodeLatency', performance.now() - startTime);
    }

    const now = performance.now();
    if (this.lastFrameTime > 0) {
      this.addSample('jitter', Math.abs(now - this.lastFrameTime - 16.67)); // 60fps baseline
    }
    this.lastFrameTime = now;
  }

  public recordBufferCount(count: number) {
    this.addSample('bufferCount', count);
  }

  public recordWasmTime(time: number) {
    this.addSample('wasmTime', time);
  }

  public recordJsTime(time: number) {
    this.addSample('jsTime', time);
  }

  private addSample(key: keyof VoltMetrics, value: number) {
    this.metrics[key].push(value);
    if (this.metrics[key].length > this.MAX_SAMPLES) {
      this.metrics[key].shift();
    }
  }

  public getMetrics(): VoltMetrics {
    return this.metrics;
  }

  public getSummary() {
    const summary: Record<string, any> = {};
    for (const key in this.metrics) {
      const samples = this.metrics[key as keyof VoltMetrics];
      if (samples.length === 0) {
        summary[key] = { avg: 0, p99: 0, max: 0 };
        continue;
      }
      const sorted = [...samples].sort((a, b) => a - b);
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      summary[key] = {
        avg: avg.toFixed(2),
        p99: sorted[Math.floor(sorted.length * 0.99)].toFixed(2),
        max: sorted[sorted.length - 1].toFixed(2),
      };
    }
    return summary;
  }
}

export const telemetry = TelemetryManager.getInstance();
