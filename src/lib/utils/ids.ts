/**
 * Generates a short, unique, and context-aware ID.
 * Format: prefix_timestamp36_random4
 * Example: clip_lx8hj2_k4p9
 */
export const generateId = (prefix: 'proj' | 'asset' | 'track' | 'clip'): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${timestamp}_${random}`;
};
