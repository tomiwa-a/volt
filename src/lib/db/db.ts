import Dexie, { type Table } from 'dexie';

export interface Project {
  id?: number;
  slug: string;
  name: string;
  fps: number;
  resolution: {
    width: number;
    height: number;
    label: string;
  };
  lastModified: number;
  createdAt: number;
}

export interface Asset {
  id?: number;
  projectId: number;
  name: string;
  type: 'video' | 'audio' | 'image';
  size: number;
  duration: number; // in milliseconds
  fileHandle: FileSystemFileHandle; // The holy grail for local-first
  lastModified: number;
}

export interface TimelineData {
  id?: number;
  projectId: number;
  tracks: any; // Simplified for now, will be our EDL structure
}

export class VoltDatabase extends Dexie {
  projects!: Table<Project>;
  assets!: Table<Asset>;
  timeline!: Table<TimelineData>;

  constructor() {
    super('VoltDB');
    this.version(1).stores({
      projects: '++id, slug, name, lastModified',
      assets: '++id, projectId, name, type',
      timeline: '++id, projectId',
    });
  }
}

export const db = new VoltDatabase();
