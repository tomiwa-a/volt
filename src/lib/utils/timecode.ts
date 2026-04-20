import { Milliseconds } from '@/types/units';

/**
 * Formats milliseconds into HH:MM:SS:FF based on a specific FPS.
 */
export const formatTimecode = (ms: Milliseconds, fps: number): string => {
  const totalSeconds = ms / 1000;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const f = Math.floor((totalSeconds % 1) * fps);

  return [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0'),
    f.toString().padStart(2, '0')
  ].join(':');
};
