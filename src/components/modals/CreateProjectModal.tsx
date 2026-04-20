'use client';

import { useState } from 'react';
import { X, Layout, Video, Monitor, Smartphone, Layers } from 'lucide-react';
import { db } from '@/lib/db/db';
import { useProjectStore } from '@/store/useProjectStore';

interface Resolution {
  id: string;
  label: string;
  width: number;
  height: number;
  icon: any;
}

const RESOLUTIONS: Resolution[] = [
  { id: '1080p',   label: 'Landscape (1080p)', width: 1920, height: 1080, icon: Monitor },
  { id: '4k',      label: 'Ultra HD (4K)',     width: 3840, height: 2160, icon: Monitor },
  { id: '9-16',    label: 'Portrait (TikTok)', width: 1080, height: 1920, icon: Smartphone },
  { id: '1-1',     label: 'Square (Post)',     width: 1080, height: 1080, icon: Layout },
];

const FPS_OPTIONS = [24, 30, 60];

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: (projectId: number) => void;
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [resId, setResId] = useState('1080p');
  const [fps, setFps] = useState(30);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name) return;
    setIsCreating(true);

    try {
      const res = RESOLUTIONS.find(r => r.id === resId)!;
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      
      const id = await db.projects.add({
        name,
        slug,
        fps,
        resolution: {
          width: res.width,
          height: res.height,
          label: res.label,
        },
        createdAt: Date.now(),
        lastModified: Date.now(),
      });

      // Update store state
      useProjectStore.getState().setProject({
        id: id.toString(),
        name,
        assets: [],
        tracks: [
          { id: 'video-1', type: 'video', clips: [] },
          { id: 'audio-1', type: 'audio', clips: [] },
        ],
      });

      onSuccess(id as number);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <Video size={18} />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Create New Project</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-900 transition-colors">
            <X size={18} />
          </button>
        </header>

        <div className="p-6 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Project Name</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Summer Vacation 2024"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all text-sm"
            />
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Layout & Resolution</label>
            <div className="grid grid-cols-2 gap-3">
              {RESOLUTIONS.map(res => {
                const Icon = res.icon;
                const active = res.id === resId;
                return (
                  <button
                    key={res.id}
                    onClick={() => setResId(res.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left group ${
                      active
                        ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                        : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-red-400' : 'text-gray-400 group-hover:text-gray-900'} />
                    <span className="mt-2 text-[11px] font-bold">{res.label}</span>
                    <span className={`text-[10px] ${active ? 'text-gray-400' : 'text-gray-400'}`}>
                      {res.width} × {res.height}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FPS */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Frame Rate (FPS)</label>
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              {FPS_OPTIONS.map(val => (
                <button
                  key={val}
                  onClick={() => setFps(val)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    fps === val
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {val} fps
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!name || isCreating}
            onClick={handleCreate}
            className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 text-white text-xs font-bold rounded-xl shadow-lg shadow-gray-200 transition-all active:scale-95"
          >
            {isCreating ? 'Creating...' : 'Launch Project'}
          </button>
        </footer>
      </div>
    </div>
  );
}
