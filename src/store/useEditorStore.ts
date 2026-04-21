import { create } from 'zustand';
import { SidebarTab } from '@/types/schema';
import { Milliseconds, ms } from '@/types/units';

interface EditorState {
  // Playback
  isPlaying: boolean;
  currentTime: Milliseconds;
  currentFrame: number;
  duration: Milliseconds;
  
  // UI State
  activeTab: SidebarTab;
  zoomLevel: number;
  selectedClipId: string | null;
  isExporting: boolean;
  showStats: boolean;
  isTimelineCollapsed: boolean;
  isSidebarOpen: boolean;

  // Actions
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlayback: () => void;
  setCurrentTime: (time: Milliseconds, fps?: number) => void;
  setCurrentFrame: (frame: number, fps?: number) => void;
  setDuration: (msval: Milliseconds) => void;
  setActiveTab: (tab: SidebarTab) => void;
  setZoomLevel: (level: number) => void;
  setSelectedClipId: (id: string | null) => void;
  setIsExporting: (isExporting: boolean) => void;
  setShowStats: (show: boolean) => void;
  setIsTimelineCollapsed: (collapsed: boolean) => void;
  setIsSidebarOpen: (open: boolean) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  isPlaying: false,
  currentTime: ms(0),
  currentFrame: 0,
  duration: ms(0),
  
  activeTab: 'assets',
  zoomLevel: 100,
  selectedClipId: null,
  isExporting: false,
  showStats: false,
  isTimelineCollapsed: false,
  isSidebarOpen: true,

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setCurrentTime: (currentTime, fps = 30) => set({ 
    currentTime: ms(Math.max(0, Number(currentTime))),
    currentFrame: Math.floor((Number(currentTime) / 1000) * fps)
  }),
  
  setCurrentFrame: (currentFrame, fps = 30) => set({ 
    currentFrame: Math.max(0, currentFrame),
    currentTime: ms(Math.round((currentFrame / fps) * 1000))
  }),
  
  setDuration: (duration) => set({ duration }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  setIsExporting: (isExporting) => set({ isExporting }),
  setShowStats: (showStats) => set({ showStats }),
  setIsTimelineCollapsed: (isTimelineCollapsed) => set({ isTimelineCollapsed }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  
  reset: () => set({
    isPlaying: false,
    currentTime: ms(0),
    currentFrame: 0,
    zoomLevel: 100,
    selectedClipId: null,
    isExporting: false,
    showStats: false,
  }),
}));
