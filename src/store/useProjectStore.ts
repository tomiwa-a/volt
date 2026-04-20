import { create } from 'zustand';
import { db } from '@/lib/db/db';
import { Asset, Clip, Track, Project } from '@/types/schema';
import { Milliseconds, ms } from '@/types/units';
import { ProjectId, AssetId, TrackId, ClipId, asProjectId } from '@/types/identifiers';
import { generateId } from '@/lib/utils/ids';

interface ProjectState {
  id: ProjectId | null;
  name: string;
  assets: Asset[];
  tracks: Track[];
  fps: number;
  resolution: { width: number; height: number; label: string };
  
  // Actions
  setProject: (data: Partial<ProjectState>) => void;
  loadProject: (id: string) => Promise<void>;
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: AssetId) => void;
  addClip: (trackId: TrackId, clip: Clip) => void;
  removeClip: (trackId: TrackId, clipId: ClipId) => void;
  updateClip: (trackId: TrackId, clipId: ClipId, updates: Partial<Clip>) => void;
  setTracks: (tracks: Track[]) => void;
  clearProject: () => void;
}

const createDefaultTracks = (): Track[] => [
  { id: generateId('track') as TrackId, type: 'video', clips: [] },
  { id: generateId('track') as TrackId, type: 'audio', clips: [] },
  { id: generateId('track') as TrackId, type: 'captions', clips: [] },
];

export const useProjectStore = create<ProjectState>((set) => ({
  id: null,
  name: 'New Project',
  assets: [],
  tracks: [],
  fps: 30,
  resolution: { width: 1920, height: 1080, label: '1080p' },

  setProject: (data) => set((state) => ({ ...state, ...data })),

  loadProject: async (id) => {
    const projectId = asProjectId(id);
    const project = await db.projects.get(projectId);
    if (!project) return;

    // Load timeline (EDL) if it exists, otherwise use defaults
    const timeline = await db.timeline.where('projectId').equals(projectId).first();
    const assets = await db.assets.where('projectId').equals(projectId).toArray();

    set({
      id: project.id,
      name: project.name,
      fps: project.fps,
      resolution: {
        width: project.resolution.width as number,
        height: project.resolution.height as number,
        label: project.resolution.label,
      },
      assets: assets.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        duration: ms(a.duration),
        size: a.size,
        handle: a.handle
      })),
      tracks: timeline?.tracks || createDefaultTracks(),
    });
  },

  addAsset: async (asset: Asset) => {
    const state = useProjectStore.getState();
    const projectId = state.id;
    if (!projectId) return;

    // Persist to DB
    await db.assets.add({
      ...asset,
      projectId: asProjectId(projectId)
    });

    set((state) => {
      const isFirstVideo = asset.type === 'video' && !state.assets.some(a => a.type === 'video');
      const newAssets = [...state.assets, asset];
      
      // Auto-add to timeline if it's the first video
      let newTracks = state.tracks;
      if (isFirstVideo) {
        const videoTrack = state.tracks.find(t => t.type === 'video');
        if (videoTrack) {
          const newClip: Clip = {
            id: generateId('clip') as ClipId,
            assetId: asset.id,
            startTime: ms(0),
            duration: asset.duration,
            assetOffset: ms(0),
          };
          newTracks = state.tracks.map(t => 
            t.id === videoTrack.id ? { ...t, clips: [...t.clips, newClip] } : t
          );
          // Async update timeline in DB
          db.timeline.where('projectId').equals(projectId).first().then(tl => {
            if (tl) db.timeline.update(tl.id!, { tracks: newTracks });
            else db.timeline.add({ id: generateId('proj'), projectId: asProjectId(projectId), tracks: newTracks });
          });
        }
      }

      return { assets: newAssets, tracks: newTracks };
    });
  },

  removeAsset: async (assetId: AssetId) => {
    set((state) => ({ 
      assets: state.assets.filter(a => a.id !== assetId) 
    }));
    await db.assets.delete(assetId);
  },

  addClip: async (trackId: TrackId, clip: Clip) => {
    set((state) => {
      const newTracks = state.tracks.map(t => 
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
      );
      
      const projectId = state.id;
      if (projectId) {
        db.timeline.where('projectId').equals(projectId).first().then(tl => {
          if (tl) db.timeline.update(tl.id!, { tracks: newTracks });
        });
      }
      
      return { tracks: newTracks };
    });
  },

  removeClip: async (trackId: TrackId, clipId: ClipId) => {
    set((state) => {
      const newTracks = state.tracks.map(t => 
        t.id === trackId ? { ...t, clips: t.clips.filter(c => c.id !== clipId) } : t
      );
      
      const projectId = state.id;
      if (projectId) {
        db.timeline.where('projectId').equals(projectId).first().then(tl => {
          if (tl) db.timeline.update(tl.id!, { tracks: newTracks });
        });
      }

      return { tracks: newTracks };
    });
  },

  updateClip: async (trackId: TrackId, clipId: ClipId, updates: Partial<Clip>) => {
    set((state) => {
      const newTracks = state.tracks.map(t => 
        t.id === trackId ? {
          ...t,
          clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c)
        } : t
      );

      const projectId = state.id;
      if (projectId) {
        db.timeline.where('projectId').equals(projectId).first().then(tl => {
          if (tl) db.timeline.update(tl.id!, { tracks: newTracks });
        });
      }

      return { tracks: newTracks };
    });
  },
  
  setTracks: async (tracks: Track[]) => {
    set({ tracks });
    const state = useProjectStore.getState();
    if (state.id) {
      const tl = await db.timeline.where('projectId').equals(state.id).first();
      if (tl) await db.timeline.update(tl.id!, { tracks });
    }
  },
  clearProject: () => set({
    id: null,
    name: 'New Project',
    assets: [],
    tracks: createDefaultTracks(),
    fps: 30,
    resolution: { width: 1920, height: 1080, label: '1080p' },
  }),
}));
