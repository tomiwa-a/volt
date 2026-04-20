import { create } from 'zustand';
import { db } from '@/lib/db/db';

export interface Asset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  duration: number; // ms
  size: number;
  handle?: FileSystemFileHandle; 
}

export interface Clip {
  id: string;
  assetId: string;
  startTime: number; 
  duration: number; 
  assetOffset: number; 
}

export interface Track {
  id: string;
  type: 'video' | 'audio' | 'captions';
  clips: Clip[];
}

interface ProjectState {
  id: string | null;
  name: string;
  assets: Asset[];
  tracks: Track[];
  fps: number;
  resolution: { width: number; height: number; label: string };
  
  // Actions
  setProject: (data: Partial<ProjectState>) => void;
  loadProject: (id: string) => Promise<void>;
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;
  addClip: (trackId: string, clip: Clip) => void;
  removeClip: (trackId: string, clipId: string) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void;
  setTracks: (tracks: Track[]) => void;
  clearProject: () => void;
}

const DEFAULT_TRACKS: Track[] = [
  { id: 'video-1', type: 'video', clips: [] },
  { id: 'audio-1', type: 'audio', clips: [] },
  { id: 'captions-1', type: 'captions', clips: [] },
];

export const useProjectStore = create<ProjectState>((set) => ({
  id: null,
  name: 'New Project',
  assets: [],
  tracks: DEFAULT_TRACKS,
  fps: 30,
  resolution: { width: 1920, height: 1080, label: '1080p' },

  setProject: (data) => set((state) => ({ ...state, ...data })),

  loadProject: async (id) => {
    const projectId = parseInt(id);
    const project = await db.projects.get(projectId);
    if (!project) return;

    // Load timeline (EDL) if it exists, otherwise use defaults
    const timeline = await db.timeline.where('projectId').equals(projectId).first();
    const assets = await db.assets.where('projectId').equals(projectId).toArray();

    set({
      id: project.id?.toString() || id,
      name: project.name,
      fps: project.fps,
      resolution: project.resolution,
      assets: assets.map(a => ({
        id: a.id?.toString() || '',
        name: a.name,
        type: a.type,
        duration: a.duration,
        size: a.size,
        handle: a.fileHandle
      })),
      tracks: timeline?.tracks || DEFAULT_TRACKS,
    });
  },

  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
  removeAsset: (assetId) => set((state) => ({ 
    assets: state.assets.filter(a => a.id !== assetId) 
  })),
  addClip: (trackId, clip) => set((state) => ({
    tracks: state.tracks.map(t => 
      t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
    )
  })),
  removeClip: (trackId, clipId) => set((state) => ({
    tracks: state.tracks.map(t => 
      t.id === trackId ? { ...t, clips: t.clips.filter(c => c.id !== clipId) } : t
    )
  })),
  updateClip: (trackId, clipId, updates) => set((state) => ({
    tracks: state.tracks.map(t => 
      t.id === trackId ? {
        ...t,
        clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c)
      } : t
    )
  })),
  setTracks: (tracks) => set({ tracks }),
  clearProject: () => set({
    id: null,
    name: 'New Project',
    assets: [],
    tracks: DEFAULT_TRACKS,
    fps: 30,
    resolution: { width: 1920, height: 1080, label: '1080p' },
  }),
}));
