import { Milliseconds } from '@/types/units';

/**
 * Memory layout for the SharedArrayBuffer:
 * [0-127] Header / Control Region (Int32Array)
 * [128...] Frame Data Slots
 */
export const HEADER_SIZE = 128;
export const MAX_FRAMES = 30; // ~250MB at 1080p

export interface FrameMetadata {
  timeMs: number;
  width: number;
  height: number;
}

export class FrameBufferManager {
  private buffer: SharedArrayBuffer;
  private header: Int32Array;
  private frameData: Uint8ClampedArray;
  
  // Indices for header fields
  private static HEAD = 0;      // Worker: Next index to write
  private static TAIL = 1;      // UI: Next index to read
  private static COUNT = 2;     // Current frames in buffer
  private static WIDTH = 3;     // Frame width
  private static HEIGHT = 4;    // Frame height
  private static CAPACITY = 5;  // Max frames

  constructor(buffer?: SharedArrayBuffer) {
    if (buffer) {
      this.buffer = buffer;
    } else {
      // Allocate fresh for a standard 1080p stream
      // 1080p RGBA = 1920 * 1080 * 4 = 8,294,400 bytes
      const frameSize = 1920 * 1080 * 4;
      const totalSize = HEADER_SIZE + (frameSize * MAX_FRAMES);
      this.buffer = new SharedArrayBuffer(totalSize);
    }

    this.header = new Int32Array(this.buffer, 0, HEADER_SIZE / 4);
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
   * Returns the reserved index, or null if the buffer is full.
   */
  public reserveWriteSlot(): number | null {
    const count = Atomics.load(this.header, FrameBufferManager.COUNT);
    const capacity = Atomics.load(this.header, FrameBufferManager.CAPACITY);

    if (count >= capacity) return null;

    // Atomically increment the HEAD for this worker's reservation
    const reservedIndex = Atomics.add(this.header, FrameBufferManager.HEAD, 1);
    return reservedIndex % capacity;
  }

  /**
   * Worker: Get the raw buffer for a specific slot index.
   */
  public getWriteBuffer(index: number): Uint8ClampedArray {
    const start = index * FrameBufferManager.FIXED_STRIDE;
    return this.frameData.subarray(start, start + FrameBufferManager.FIXED_STRIDE);
  }

  /**
   * Worker: Mark a frame as committed to the buffer.
   */
  public commitWrite(timeMs: number) {
    // HEAD was already advanced atomically in reserveWriteSlot().
    // We only need to increment COUNT to signal the frame is ready for the UI.
    Atomics.add(this.header, FrameBufferManager.COUNT, 1);
    Atomics.notify(this.header, FrameBufferManager.COUNT);
  }

  /**
   * UI: Get the slot for the frame closest to timeMs.
   */
  public getFrameAt(timeMs: number): Uint8ClampedArray | null {
    const count = Atomics.load(this.header, FrameBufferManager.COUNT);
    if (count === 0) return null;

    const tail = Atomics.load(this.header, FrameBufferManager.TAIL);
    const start = tail * FrameBufferManager.FIXED_STRIDE;
    return this.frameData.subarray(start, start + FrameBufferManager.FIXED_STRIDE);
  }

  /**
   * UI: Mark frames as read to free up space.
   */
  public advance(frames = 1) {
    const count = Atomics.load(this.header, FrameBufferManager.COUNT);
    const tail = Atomics.load(this.header, FrameBufferManager.TAIL);
    const capacity = Atomics.load(this.header, FrameBufferManager.CAPACITY);

    const toRemove = Math.min(frames, count);
    Atomics.store(this.header, FrameBufferManager.TAIL, (tail + toRemove) % capacity);
    Atomics.sub(this.header, FrameBufferManager.COUNT, toRemove);
  }

  public clear() {
    Atomics.store(this.header, FrameBufferManager.HEAD, 0);
    Atomics.store(this.header, FrameBufferManager.TAIL, 0);
    Atomics.store(this.header, FrameBufferManager.COUNT, 0);
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
    return {
      count: Atomics.load(this.header, FrameBufferManager.COUNT),
      capacity: Atomics.load(this.header, FrameBufferManager.CAPACITY),
      width: Atomics.load(this.header, FrameBufferManager.WIDTH),
      height: Atomics.load(this.header, FrameBufferManager.HEIGHT),
    };
  }
}
