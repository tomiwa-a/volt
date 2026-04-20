/**
 * Branded ID types to ensure we don't mix up project, asset, track, and clip IDs.
 */

export type ProjectId = string & { readonly __brand: 'ProjectId' };
export type AssetId = string & { readonly __brand: 'AssetId' };
export type TrackId = string & { readonly __brand: 'TrackId' };
export type ClipId = string & { readonly __brand: 'ClipId' };

// Helpers for casting (use with caution, mostly for DB hydration)
export const asProjectId = (s: string) => s as ProjectId;
export const asAssetId = (s: string) => s as AssetId;
export const asTrackId = (s: string) => s as TrackId;
export const asClipId = (s: string) => s as ClipId;
