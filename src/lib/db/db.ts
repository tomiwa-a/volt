import Dexie, { type Table } from 'dexie';
import { Project, Asset, Track } from '@/types/schema';
import { ProjectId } from '@/types/identifiers';

export interface TimelineData {
  id: string; // Timeline ID
  projectId: ProjectId; 
  tracks: Track[];
}

export class VoltDatabase extends Dexie {
  projects!: Table<Project>; 
  assets!: Table<Asset & { projectId: ProjectId }>;
  timeline!: Table<TimelineData>;

  constructor() {
    super('VoltDatabase');
    this.version(3).stores({
      projects: 'id, slug, name, lastModified',
      assets: 'id, projectId, type',
      timeline: 'id, projectId'
    });
  }
}

export const db = new VoltDatabase();
