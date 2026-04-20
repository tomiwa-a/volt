import { Milliseconds, ms } from '@/types/units';

export interface MediaMetadata {
  name: string;
  size: number;
  type: 'video' | 'audio' | 'image';
  duration: Milliseconds;
}

export class MediaService {
  /**
   * Opens the native file picker and returns a handle + metadata.
   */
  async pickMedia(): Promise<{ handle: FileSystemFileHandle; metadata: MediaMetadata } | null> {
    if (typeof window.showOpenFilePicker !== 'function') {
      alert('Your browser does not support the File System Access API. Please use a Chromium-based browser (Chrome, Edge, Brave) for local file editing.');
      return null;
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Media Files',
            accept: {
              'video/*': ['.mp4', '.mov', '.webm'],
              'audio/*': ['.mp3', '.wav', '.ogg'],
              'image/*': ['.jpg', '.png', '.webp'],
            },
          },
        ],
        multiple: false,
      });

      const file = await handle.getFile();
      const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';
      
      let duration = ms(0);
      if (type === 'video' || type === 'audio') {
        duration = await this.getVideoDuration(file);
      }

      return {
        handle,
        metadata: {
          name: file.name,
          size: file.size,
          type,
          duration,
        },
      };
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null;
      throw err;
    }
  }

  /**
   * Extracts duration from a file by temporarily loading it into a video element.
   */
  private getVideoDuration(file: File): Promise<Milliseconds> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(ms(Math.round(video.duration * 1000)));
      };
      video.onerror = () => {
        resolve(ms(0));
      };
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Verifies if we still have permission to read the handle.
   * If 'prompt', we need a user gesture to request.
   */
  async verifyPermission(handle: FileSystemFileHandle, withPrompt = false): Promise<boolean> {
    const options: FileSystemHandlePermissionDescriptor = { mode: 'read' };
    if ((await handle.queryPermission(options)) === 'granted') {
      return true;
    }
    if (withPrompt && (await handle.requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  }
}

export const mediaService = new MediaService();
