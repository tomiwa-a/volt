/**
 * Branded types for stronger type safety.
 * These prevent accidental assignment of generic numbers to specific units.
 */

export type Milliseconds = number & { readonly __brand: 'ms' };
export type Pixels = number & { readonly __brand: 'px' };
export type Frames = number & { readonly __brand: 'frames' };

// Helpers for casting
export const ms = (n: number) => n as Milliseconds;
export const px = (n: number) => n as Pixels;
export const frames = (n: number) => n as Frames;
