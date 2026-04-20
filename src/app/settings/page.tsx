'use client';

import { useState } from 'react';
import { 
  Settings, 
  Database, 
  Cpu, 
  Brain, 
  ChevronLeft, 
  Moon, 
  Sun, 
  HardDrive, 
  ShieldCheck, 
  Trash2,
  Download,
  Info
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'general' | 'storage' | 'engine' | 'ai';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const navItems = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'storage', label: 'Storage & Privacy', icon: Database },
    { id: 'engine', label: 'Processing Engine', icon: Cpu },
    { id: 'ai', label: 'AI Models', icon: Brain },
  ];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-8 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all border border-transparent">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Settings</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-10 flex gap-12">
        {/* Navigation Sidebar */}
        <aside className="w-64 flex-shrink-0 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-red-700 text-white shadow-md shadow-red-200' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <section className="flex-1 max-w-2xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'storage' && <StorageSettings />}
          {activeTab === 'engine' && <EngineSettings />}
          {activeTab === 'ai' && <AISettings />}
        </section>
      </div>
    </main>
  );
}

function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">General</h2>
        <p className="text-sm text-gray-500">Manage your basic preferences and defaults.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sun size={20} className="text-orange-500" />
            <div>
              <p className="text-sm font-semibold">Appearance</p>
              <p className="text-xs text-gray-400">Choose how Volt looks to you</p>
            </div>
          </div>
          <select className="text-sm bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg outline-none focus:border-red-700 transition-all">
            <option>Light</option>
            <option>Dark</option>
            <option>System</option>
          </select>
        </div>

        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-blue-500" />
            <div>
              <p className="text-sm font-semibold">Default Export Format</p>
              <p className="text-xs text-gray-400">Preferred extension for new projects</p>
            </div>
          </div>
          <select className="text-sm bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg outline-none focus:border-red-700 transition-all">
            <option>MP4 (.mp4)</option>
            <option>WebM (.webm)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function StorageSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">Storage & Privacy</h2>
        <p className="text-sm text-gray-500">Volt is local-first. Your files never leave your browser.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <HardDrive size={18} className="text-gray-400" />
              <p className="text-sm font-semibold">Local Storage Usage</p>
            </div>
            <p className="text-xs font-medium text-gray-500">12.4 GB used of 50 GB estimated</p>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-700 rounded-full w-[24.8%] transition-all duration-1000" />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Privacy Protection</p>
            <p className="text-xs text-gray-400">All data is encrypted in IndexedDB</p>
          </div>
          <ShieldCheck size={20} className="text-green-500" />
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
          <Trash2 size={16} />
          Clear All Local Data
        </button>
      </div>
    </div>
  );
}

function EngineSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">Processing Engine</h2>
        <p className="text-sm text-gray-500">High-performance Go WASM sidecar configuration.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            <div>
              <p className="text-sm font-semibold">Go Engine Status</p>
              <p className="text-xs text-gray-400">WASM Binary v1.0.4 loaded</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 uppercase tracking-tight">Active</span>
        </div>

        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Hardware Acceleration</p>
            <p className="text-xs text-gray-400">Uses WebCodecs and GPU compositing</p>
          </div>
          <div className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-700" />
          </div>
        </div>

        <div className="p-5 flex items-center gap-3 text-blue-600 bg-blue-50/30">
          <Info size={16} />
          <p className="text-[11px] leading-relaxed">
            The processing engine runs in a separate Web Worker thread to ensure the UI remains responsive during intense rendering tasks.
          </p>
        </div>
      </div>
    </div>
  );
}

function AISettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">AI Models</h2>
        <p className="text-sm text-gray-500">On-device transcription and analysis.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain size={20} className="text-purple-500" />
              <div>
                <p className="text-sm font-semibold">Whisper Base (Recommended)</p>
                <p className="text-xs text-gray-400">Balanced speed and accuracy (142 MB)</p>
              </div>
            </div>
            <button className="px-4 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors">
              Installed
            </button>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 w-full" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            < ब्रेन size={20} className="text-gray-300" />
            <div>
              <p className="text-sm font-semibold">Whisper Tiny</p>
              <p className="text-xs text-gray-400">Fastest performance, less accurate (75 MB)</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-1.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={14} />
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
