import { Milliseconds } from '@/types/units';

/**
 * Memory layout for the SharedArrayBuffer:
 * [0-127] Header / Control Region (Int32Array)
 * [128...] Frame Data Slots
 */
export const HEADER_SIZE = 1024;
export const MAX_FRAMES = 60; // cushion for 60fps

export interface FrameMetadata {
  timeMs: number;
  width: number;
  height: number;
}

export class FrameBufferManager {
  private buffer: SharedArrayBuffer;
  private header: Int32Array;
  private metadata: Float64Array;
  private frameData: Uint8ClampedArray;
  
  // Indices for header fields
  private static HEAD = 0;      // Worker: Absolute index of next write
  private static TAIL = 1;      // UI: Absolute index of next read
  private static WIDTH = 2;     // Frame width
  private static HEIGHT = 3;    // Frame height
  private static CAPACITY = 4;  // Max frames

  constructor(buffer?: SharedArrayBuffer) {
    if (buffer) {
      this.buffer = buffer;
    } else {
      // Allocate fresh for a standard 1080p stream
      const frameSize = 1920 * 1080 * 4;
      const totalSize = HEADER_SIZE + (frameSize * MAX_FRAMES);
      this.buffer = new SharedArrayBuffer(totalSize);
    }

    this.header = new Int32Array(this.buffer, 0, 128 / 4);
    this.metadata = new Float64Array(this.buffer, 128, MAX_FRAMES);
    this.frameData = new Uint8ClampedArray(this.buffer, HEADER_SIZE);

    if (!buffer) {
      Atomics.store(this.header, FrameBufferManager.CAPACITY, MAX_FRAMES);
      Atomics.store(this.header, FrameBufferManager.WIDTH, 1920);
      Atomics.store(this.header, FrameBufferManager.HEIGHT, 1080);
    }
  }

  public getBuffer(): SharedArrayBuffer {
    return this.buffer;
  }

  private static FIXED_STRIDE = 1920 * 1080 * 4;

  /**
   * Worker: Atomically reserve the next available slot index to write into.
   * Returns the absolute index, or null if the buffer is full.
   */
  public reserveWriteSlot(): number | null {
    const head = Atomics.load(this.header, FrameBufferManager.HEAD);
    const tail = Atomics.load(this.header, FrameBufferManager.TAIL);
    const capacity = Atomics.load(this.header, FrameBufferManager.CAPACITY);

    if (head - tail >= capacity) return null;

    // Atomically increment the HEAD for this worker's reservation
    const absoluteIndex = Atomics.add(this.header, FrameBufferManager.HEAD, 1);
    
    // Double check we didn't overshoot
    if (absoluteIndex - tail >= capacity) {
      return null;
    }

    // Set metadata to -1 so UI knows it's currently copying
    this.metadata[absoluteIndex % capacity] = -1;

    return absoluteIndex;
  }

  /**
   * Worker: Get the raw buffer for a specific absolute index.
   */
  public getWriteBuffer(absoluteIndex: number): Uint8ClampedArray {
    const capacity = Atomics.load(this.header, FrameBufferManager.CAPACITY);
    const start = (absoluteIndex % capacity) * FrameBufferManager.FIXED_STRIDE;
    return this.frameData.subarray(start, start + FrameBufferManager.FIXED_STRIDE);
  }

  /**
   * Worker: Mark a frame as copied into the buffer by stamping its time.
   */
  public commitWrite(absoluteIndex: number, timeMs: number) {
    const capacity = Atomics.load(this.header, FrameBufferManager.CAPACITY);
    this.metadata[absoluteIndex % capacity] = timeMs;
  }

  /**
   * UI: Get the slot for the frame closest to timeMs.
   */
  public getFrameAt(timeMs: number): Uint8ClampedArray | null {
    const head = Atomics.load(this.header, FrameBufferManager.HEAD);
    let tail = Atomics.load(this.header, FrameBufferManager.TAIL);
    const capacity = Atomics.load(this.header, FrameBufferManager.CAPACITY);

    if (head <= tail) return null; // Empty

    let bestIndex = -1;
    let minDiff = Infinity;

    for (let i = tail; i < head; i++) {
        const frameTime = this.metadata[i % capacity];
        if (frameTime === -1) continue; // Not copied into memory yet
        
        const diff = Math.abs(frameTime - timeMs);
        if (diff < minDiff) {
            minDiff = diff;
            bestIndex = i;
        }
    }

    if (bestIndex !== -1) {
      // Auto-advance TAIL to free up space behind the playhead.
      // Leave a 5-frame trailing buffer for instant backward scrubbing.
      const newTail = Math.max(tail, bestIndex - 5);
      Atomics.store(this.header, FrameBufferManager.TAIL, newTail);

      const start = (bestIndex % capacity) * FrameBufferManager.FIXED_STRIDE;
      return this.frameData.subarray(start, start + FrameBufferManager.FIXED_STRIDE);
    }
    
    return null;
  }

  public clear() {
    Atomics.store(this.header, FrameBufferManager.HEAD, 0);
    Atomics.store(this.header, FrameBufferManager.TAIL, 0);
  }

  /**
   * Worker: Update the resolution in the header.
   */
  public setDimensions(width: number, height: number) {
    Atomics.store(this.header, FrameBufferManager.WIDTH, width);
    Atomics.store(this.header, FrameBufferManager.HEIGHT, height);
  }

  /**
   * UI: Get the current video dimensions from the buffer.
   */
  public getDimensions() {
    return {
      width: Atomics.load(this.header, FrameBufferManager.WIDTH),
      height: Atomics.load(this.header, FrameBufferManager.HEIGHT),
    };
  }

  public getStats() {
    const head = Atomics.load(this.header, FrameBufferManager.HEAD);
    const tail = Atomics.load(this.header, FrameBufferManager.TAIL);
    return {
      count: Math.max(0, head - tail),
      capacity: Atomics.load(this.header, FrameBufferManager.CAPACITY),
      width: Atomics.load(this.header, FrameBufferManager.WIDTH),
      height: Atomics.load(this.header, FrameBufferManager.HEIGHT),
    };
  }
}
