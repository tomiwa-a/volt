import { Milliseconds, Pixels } from './units';
import { ProjectId, AssetId, TrackId, ClipId } from './identifiers';

export type SidebarTab = 'assets' | 'text' | 'captions' | 'layers';

export interface Resolution {
  width: Pixels;
  height: Pixels;
  label: string;
}

export interface Asset {
  id: AssetId;
  name: string;
  type: 'video' | 'audio' | 'image';
  duration: Milliseconds;
  size: number; // bytes
  handle?: FileSystemFileHandle; 
}

export interface Clip {
  id: ClipId;
  assetId: AssetId;
  startTime: Milliseconds; // offset on timeline
  duration: Milliseconds; // duration of clip on timeline
  assetOffset: Milliseconds; // where in the source asset the clip starts
}

export interface Track {
  id: TrackId;
  type: 'video' | 'audio' | 'captions';
  clips: Clip[];
}

export interface Project {
  id: ProjectId;
  slug: string;
  name: string;
  fps: number;
  resolution: Resolution;
  lastModified: number;
  createdAt: number;
}
