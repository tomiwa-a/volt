'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, MoreVertical, Calendar, Film, X, Edit2, Trash2, Video } from 'lucide-react';
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Dropdown State
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePickFile = async () => {
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'Video Files', accept: { 'video/*': ['.mp4', '.mov', '.webm'] } }],
      });
      const file = await fileHandle.getFile();
      setSelectedFile(file);
      if (!newProjectName) {
        setNewProjectName(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (err) {
      console.log('User cancelled file picker');
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName || !selectedFile) return;

    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProjectName,
      lastEdited: 'Just now',
      duration: '0:00', // To be calculated
    };

    setProjects([newProject, ...projects]);
    setIsModalOpen(false);
    setNewProjectName('');
    setSelectedFile(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-red-100 relative">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-8 py-5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-700">
              <Film size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Volt</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-md bg-red-700 hover:bg-red-800 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200"
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
              onClick={() => setIsModalOpen(true)}
              className="group h-56 rounded-lg border border-dashed border-gray-300 hover:border-red-700 hover:bg-red-50 hover:text-red-700 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-700 transition-all duration-200"
            >
              <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-red-700">
                <Plus size={24} />
                <div className="text-center font-medium">Create New</div>
              </div>
            </button>

            {/* Existing Projects */}
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative h-56 rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-gray-300 transition-all duration-200 flex flex-col"
              >
                <Link href={`/editor/${project.id}`} className="flex-1 flex flex-col">
                  {/* Thumbnail Area */}
                  <div className="relative flex-1 bg-gray-100 border-b border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors duration-200">
                    <Film size={32} className="text-gray-300 group-hover:text-red-600 transition-colors duration-200" />
                    <div className="absolute bottom-2 right-2 bg-gray-900/70 px-2 py-0.5 rounded text-[11px] font-mono font-medium text-white">
                      {project.duration}
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-4 bg-white relative">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate pr-8 group-hover:text-red-700 transition-colors">
                        {project.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={12} className="opacity-70" />
                      Edited {project.lastEdited}
                    </div>
                  </div>
                </Link>

                {/* Dropdown Toggle */}
                <button
                  className="absolute bottom-4 right-3 p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 z-10 transition-colors duration-200"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === project.id ? null : project.id);
                  }}
                >
                  <MoreVertical size={16} />
                </button>

                {/* Dropdown Menu */}
                {openDropdownId === project.id && (
                  <div 
                    ref={dropdownRef}
                    className="absolute right-3 bottom-12 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-20 overflow-hidden animate-in fade-in zoom-in duration-200"
                  >
                    <Link 
                      href={`/editor/${project.id}`}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-700 transition-colors duration-200"
                    >
                      <Edit2 size={14} /> Edit
                    </Link>
                    <button 
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-700 transition-colors duration-200 border-t border-gray-100"
                      onClick={() => {/* Rename logic */}}
                    >
                      <Video size={14} /> Rename
                    </button>
                    <button 
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 border-t border-gray-100"
                      onClick={() => setProjects(projects.filter(p => p.id !== project.id))}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">New Project</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Project Name</label>
                <input 
                  type="text" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. My Amazing Video"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Media Source</label>
                {!selectedFile ? (
                  <button 
                    onClick={handlePickFile}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 text-gray-500 hover:border-red-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                  >
                    <Plus size={24} />
                    <span className="text-xs font-medium">Select a video file to begin</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex-shrink-0 p-2 bg-red-100 text-red-700 rounded">
                        <Film size={18} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">{selectedFile.name}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedFile(null)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button 
                disabled={!newProjectName || !selectedFile}
                onClick={handleCreateProject}
                className="px-6 py-2.5 rounded-md bg-red-700 text-white text-sm font-medium hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
