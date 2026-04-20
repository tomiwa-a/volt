import { create } from 'zustand';

export interface Asset {
  id: string;
  name: string;
  type: 'video' | 'audio';
  duration: number; // ms
  size: number;
  handle?: FileSystemFileHandle; // From File System Access API
  url?: string; // For preview/rendering
}

export interface Clip {
  id: string;
  assetId: string;
  startTime: number; // offset in timeline (ms)
  duration: number; // duration of clip on timeline (ms)
  assetOffset: number; // where in the asset the clip starts (ms)
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
  
  // Actions
  setProjectId: (id: string) => void;
  setProjectName: (name: string) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;
  addClip: (trackId: string, clip: Clip) => void;
  removeClip: (trackId: string, clipId: string) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void;
  setTracks: (tracks: Track[]) => void;
  clearProject: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  id: 'project-1',
  name: 'Summer Vlog 2024',
  assets: [
    { id: 'a1', name: 'vlog_intro.mp4', type: 'video', duration: 12500, size: 24500000 },
    { id: 'a2', name: 'beach_broll.mp4', type: 'video', duration: 8200, size: 15100000 },
    { id: 'a3', name: 'lofi_vibes.mp3', type: 'audio', duration: 185000, size: 8200000 },
    { id: 'a4', name: 'voiceover.wav', type: 'audio', duration: 32000, size: 12400000 },
  ],
  tracks: [
    { id: 'video-1', type: 'video', clips: [] },
    { id: 'audio-1', type: 'audio', clips: [] },
    { id: 'captions-1', type: 'captions', clips: [] },
  ],

  setProjectId: (id) => set({ id }),
  setProjectName: (name) => set({ name }),
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
    name: 'Untitled Project',
    assets: [],
    tracks: [
      { id: 'video-1', type: 'video', clips: [] },
      { id: 'audio-1', type: 'audio', clips: [] },
      { id: 'captions-1', type: 'captions', clips: [] },
    ],
  }),
}));
