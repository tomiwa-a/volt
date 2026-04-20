'use client';

import { useState } from 'react';
import { Plus, MoreVertical, Calendar, Film } from 'lucide-react';
import Link from 'next/link';

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
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-red-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-8 py-5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-700">
              <Film size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Projects</h1>
          </div>
          <button
            onClick={handleNewProject}
            className="flex items-center justify-center gap-2 rounded-md bg-red-700 hover:bg-red-800 px-5 py-2.5 text-sm font-medium text-white"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      </header>

      {/* Projects Grid */}
      <div className="px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* New Project Card Trigger */}
            <button
              onClick={handleNewProject}
              className="group h-56 rounded-lg border border-dashed border-gray-300 hover:border-red-700 hover:bg-red-50 hover:text-red-700 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
            >
              <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-red-700">
                <Plus size={24} />
                <div className="text-center font-medium">
                  Create New
                </div>
              </div>
            </button>

            {/* Existing Projects */}
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/editor/${project.id}`}
                className="group h-56 rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-gray-300 outline-none focus-visible:ring-2 focus-visible:ring-red-700 flex flex-col"
              >
                {/* Thumbnail Area - Minimal, flat */}
                <div className="relative flex-1 bg-gray-100 border-b border-gray-100 flex items-center justify-center group-hover:bg-gray-50">
                  <Film size={32} className="text-gray-300 group-hover:text-red-600" />
                  
                  {/* Duration pill */}
                  <div className="absolute bottom-2 right-2 bg-gray-900/70 px-2 py-0.5 rounded text-[11px] font-mono font-medium text-white">
                    {project.duration}
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-4 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate pr-4 group-hover:text-red-700">
                      {project.name}
                    </h3>
                    <button
                      className="p-1 -mr-1 rounded text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-700"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar size={12} className="opacity-70" />
                    Edited {project.lastEdited}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
