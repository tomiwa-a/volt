import { Milliseconds, ms, Pixels } from '@/types/units';

/**
 * Converts Milliseconds to Pixels based on zoom level.
 * Default scale: 100px = 1 second (1000ms) at 100% zoom.
 */
export function msToPx(time: Milliseconds, zoomLevel: number): Pixels {
  // px = ms * (zoom / 1000)
  return (Number(time) * (zoomLevel / 1000)) as Pixels;
}

/**
 * Converts Pixels to Milliseconds based on zoom level.
 */
export function pxToMs(pixels: number, zoomLevel: number): Milliseconds {
  // ms = px / (zoom / 1000)
  return ms(Math.max(0, Math.round(pixels / (zoomLevel / 1000))));
}
