import { create } from 'zustand';

export type SidebarTab = 'assets' | 'text' | 'captions' | 'layers';

interface EditorState {
  // Playback
  isPlaying: boolean;
  currentTime: number; // in milliseconds
  currentFrame: number;
  duration: number; // total duration of project in ms
  
  // UI State
  activeTab: SidebarTab;
  zoomLevel: number;
  selectedClipId: string | null;
  isExporting: boolean;
  showStats: boolean;
  isTimelineCollapsed: boolean;

  // Actions
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlayback: () => void;
  setCurrentTime: (time: number) => void;
  setCurrentFrame: (frame: number) => void;
  setDuration: (ms: number) => void;
  setActiveTab: (tab: SidebarTab) => void;
  setZoomLevel: (level: number) => void;
  setSelectedClipId: (id: string | null) => void;
  setIsExporting: (isExporting: boolean) => void;
  setShowStats: (show: boolean) => void;
  setIsTimelineCollapsed: (collapsed: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  isPlaying: false,
  currentTime: 0,
  currentFrame: 0,
  duration: 0,
  
  activeTab: 'assets',
  zoomLevel: 100,
  selectedClipId: null,
  isExporting: false,
  showStats: false,
  isTimelineCollapsed: false,

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setCurrentFrame: (currentFrame) => set({ currentFrame }),
  setDuration: (duration) => set({ duration }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  setIsExporting: (isExporting) => set({ isExporting }),
  setShowStats: (showStats) => set({ showStats }),
  setIsTimelineCollapsed: (isTimelineCollapsed) => set({ isTimelineCollapsed }),
}));
