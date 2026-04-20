'use client';

import { useState } from 'react';
import { X, Upload, Film, Music, AlignLeft, AlignCenter, AlignRight, ChevronRight, Mic } from 'lucide-react';

interface SecondarySidebarProps {
  activeTab: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SecondarySidebar({ activeTab, isOpen, onClose }: SecondarySidebarProps) {
  if (!isOpen) return null;

  const labels: Record<string, string> = {
    assets: 'Assets',
    text: 'Text',
    captions: 'Captions',
    layers: 'Tracks',
  };

  return (
    <div className="w-[300px] flex-shrink-0 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="h-[44px] px-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-gray-900 tracking-tight">{labels[activeTab]}</span>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'assets' && <AssetsPanel />}
        {activeTab === 'text' && <TextPanel />}
        {activeTab === 'captions' && <CaptionsPanel />}
        {activeTab === 'layers' && <LayersPanel />}
      </div>
    </div>
  );
}

type AssetFilter = 'all' | 'video' | 'audio';

const MOCK_ASSETS = [
  { id: '1', name: 'summer_vlog_main.mp4', type: 'video' as const, duration: '12:34' },
  { id: '2', name: 'b_roll_beach.mp4',     type: 'video' as const, duration: '02:11' },
  { id: '3', name: 'ambient_waves.mp3',    type: 'audio' as const, duration: '05:00' },
  { id: '4', name: 'voiceover_take2.mp3',  type: 'audio' as const, duration: '01:43' },
];

function AssetsPanel() {
  const [filter, setFilter] = useState<AssetFilter>('all');

  const filtered = MOCK_ASSETS.filter(a => filter === 'all' || a.type === filter);

  const filters: { id: AssetFilter; label: string }[] = [
    { id: 'all',   label: 'All' },
    { id: 'video', label: 'Video' },
    { id: 'audio', label: 'Audio' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Filter row */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-1">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              filter === f.id
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          className="ml-auto p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="Import media"
        >
          <Upload size={14} />
        </button>
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-gray-400">No {filter} files linked to this project.</p>
            <button className="mt-3 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-800">
              Import one
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map(asset => (
              <li
                key={asset.id}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-grab active:cursor-grabbing transition-colors"
              >
                <div className={`flex-shrink-0 p-1.5 rounded-md ${
                  asset.type === 'video'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-sky-100 text-sky-600'
                }`}>
                  {asset.type === 'video' ? <Film size={14} /> : <Music size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{asset.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{asset.duration}</p>
                </div>
                <ChevronRight size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Simulates "nothing selected" state — in production, this comes from Zustand
const SELECTED_CLIP = null as null | { label: string };

function TextPanel() {
  const [fontSize, setFontSize] = useState('32');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);

  if (!SELECTED_CLIP) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 gap-2 text-center">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
          <AlignCenter size={16} />
        </div>
        <p className="text-xs font-medium text-gray-600">No text clip selected</p>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Click a text or caption clip on the timeline to edit its style here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Font */}
      <section className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Font</label>
        <select className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-900 outline-none transition-all">
          <option>Inter</option>
          <option>Roboto Mono</option>
          <option>Playfair Display</option>
          <option>Space Grotesk</option>
        </select>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              value={fontSize}
              onChange={e => setFontSize(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-900 outline-none"
              placeholder="Size"
            />
          </div>
          <select className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-900 outline-none">
            <option>Regular</option>
            <option>Medium</option>
            <option>Bold</option>
          </select>
        </div>
      </section>

      {/* Style */}
      <section className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Style</label>
        <div className="flex gap-1.5">
          {[
            { key: 'bold', label: 'B', active: bold, toggle: () => setBold(!bold), className: 'font-bold' },
            { key: 'italic', label: 'I', active: italic, toggle: () => setItalic(!italic), className: 'italic' },
            { key: 'underline', label: 'U', active: underline, toggle: () => setUnderline(!underline), className: 'underline' },
          ].map(b => (
            <button
              key={b.key}
              onClick={b.toggle}
              className={`flex-1 py-1.5 text-xs border rounded-md transition-colors ${b.className} ${
                b.active
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </section>

      {/* Alignment */}
      <section className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Alignment</label>
        <div className="flex gap-1.5">
          {([
            { id: 'left', icon: AlignLeft },
            { id: 'center', icon: AlignCenter },
            { id: 'right', icon: AlignRight },
          ] as const).map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setAlign(id)}
              className={`flex-1 py-2 flex justify-center border rounded-md transition-colors ${
                align === id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </section>

      {/* Colors */}
      <section className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Color</label>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[11px] text-gray-500">Text</span>
            <input type="color" defaultValue="#ffffff" className="w-8 h-7 rounded border border-gray-200 cursor-pointer bg-transparent p-0.5" />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[11px] text-gray-500">BG</span>
            <input type="color" defaultValue="#000000" className="w-8 h-7 rounded border border-gray-200 cursor-pointer bg-transparent p-0.5" />
          </div>
        </div>
      </section>

      {/* Position */}
      <section className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Position</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 focus-within:border-gray-900 focus-within:bg-white transition-colors">
              <span className="px-2 text-[10px] font-semibold text-gray-400 border-r border-gray-200">X</span>
              <input type="number" defaultValue={960} className="flex-1 px-2 py-2 text-xs outline-none bg-transparent" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 focus-within:border-gray-900 focus-within:bg-white transition-colors">
              <span className="px-2 text-[10px] font-semibold text-gray-400 border-r border-gray-200">Y</span>
              <input type="number" defaultValue={880} className="flex-1 px-2 py-2 text-xs outline-none bg-transparent" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

type TranscribeStatus = 'idle' | 'running' | 'done';

const MOCK_SEGMENTS = [
  { id: '1', start: '00:00:02', end: '00:00:06', text: 'Hey guys, welcome back to another vlog.' },
  { id: '2', start: '00:00:07', end: '00:00:11', text: "Today we're at the beach in Santa Monica." },
  { id: '3', start: '00:00:13', end: '00:00:17', text: "It's about 85 degrees and honestly perfect." },
];

function CaptionsPanel() {
  const [status, setStatus] = useState<TranscribeStatus>('done');

  return (
    <div className="flex flex-col h-full">
      {/* Transcribe action */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic size={13} className={status === 'running' ? 'text-red-600 animate-pulse' : 'text-gray-400'} />
          <span className="text-[11px] font-semibold text-gray-700">
            {status === 'idle' && 'Not transcribed'}
            {status === 'running' && 'Transcribing…'}
            {status === 'done' && `${MOCK_SEGMENTS.length} segments`}
          </span>
        </div>
        {status !== 'running' && (
          <button
            onClick={() => setStatus('running')}
            className="text-[11px] font-semibold text-red-700 hover:text-red-800 transition-colors"
          >
            {status === 'done' ? 'Re-run' : 'Transcribe'}
          </button>
        )}
      </div>

      {/* Segments list */}
      {status === 'done' && (
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-gray-100">
            {MOCK_SEGMENTS.map(seg => (
              <li key={seg.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                <span className="block text-[10px] font-mono text-gray-400 mb-1">{seg.start} → {seg.end}</span>
                <p className="text-xs text-gray-800 leading-relaxed">{seg.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Global style */}
      {status === 'done' && (
        <div className="px-4 py-4 border-t border-gray-100 space-y-3">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Global Style</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 focus-within:border-gray-900 transition-colors">
              <span className="px-2 text-[10px] text-gray-400 border-r border-gray-200 font-semibold">px</span>
              <input type="number" defaultValue={28} className="flex-1 px-2 py-2 text-xs outline-none bg-transparent" />
            </div>
            <input type="color" defaultValue="#ffffff" className="w-8 h-[34px] rounded border border-gray-200 cursor-pointer bg-transparent p-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}

function LayersPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 gap-2 text-center">
      <p className="text-xs text-gray-400">Track management coming in a future update.</p>
    </div>
  );
}
