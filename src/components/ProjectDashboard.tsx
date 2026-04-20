'use client';

import { useState } from 'react';
import { Plus, MoreVertical, Calendar, Clock } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  lastEdited: string;
  duration: string;
  thumbnail?: string;
}

export default function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Summer Vlog 2026',
      lastEdited: '2 days ago',
      duration: '12:34',
    },
    {
      id: '2',
      name: 'Product Demo',
      lastEdited: '1 week ago',
      duration: '4:22',
    },
  ]);

  const handleNewProject = async () => {
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'Video Files', accept: { 'video/*': ['.mp4', '.mov', '.webm'] } }],
      });
      const file = await fileHandle.getFile();
      // TODO: Create project in IndexedDB
      console.log('Selected file:', file.name);
    } catch (err) {
      console.log('User cancelled file picker');
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-zinc-400 mt-2">Create or open a project to begin editing</p>
        </div>
      </header>

      {/* Projects Grid */}
      <div className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* New Project Card */}
            <button
              onClick={handleNewProject}
              className="group relative h-64 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:border-blue-500 hover:bg-zinc-900/80 transition-all flex items-center justify-center cursor-pointer"
            >
              <div className="flex flex-col items-center gap-3 group-hover:gap-4 transition-all">
                <div className="p-3 rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors">
                  <Plus size={28} className="text-blue-400 group-hover:text-blue-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">New Project</p>
                  <p className="text-sm text-zinc-400">Select a video file</p>
                </div>
              </div>
            </button>

            {/* Existing Projects */}
            {projects.map((project) => (
              <a
                key={project.id}
                href={`/editor/${project.id}`}
                className="group relative h-64 rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden hover:border-zinc-600 transition-all hover:shadow-lg hover:shadow-blue-500/10"
              >
                {/* Thumbnail */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-600/20 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-400">▶</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black via-transparent to-transparent">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-white line-clamp-2 group-hover:text-blue-300 transition-colors">
                      {project.name}
                    </h3>
                    <button
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-800 transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        // TODO: Show context menu
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {project.lastEdited}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {project.duration}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
