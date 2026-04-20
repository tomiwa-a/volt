import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type ExportFormat = 'mp4' | 'webm';
export type Resolution = '720p' | '1080p' | '4k';
export type FrameRate = '24' | '30' | '60';

interface SettingsState {
  theme: Theme;
  exportFormat: ExportFormat;
  resolution: Resolution;
  frameRate: FrameRate;
  
  setTheme: (theme: Theme) => void;
  setExportFormat: (format: ExportFormat) => void;
  setResolution: (res: Resolution) => void;
  setFrameRate: (fps: FrameRate) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      exportFormat: 'mp4',
      resolution: '1080p',
      frameRate: '30',

      setTheme: (theme) => set({ theme }),
      setExportFormat: (exportFormat) => set({ exportFormat }),
      setResolution: (resolution) => set({ resolution }),
      setFrameRate: (frameRate) => set({ frameRate }),
    }),
    {
      name: 'volt-settings', // name of the item in storage (must be unique)
    }
  )
);
