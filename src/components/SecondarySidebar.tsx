'use client';

import { useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { useProjectStore } from '@/store/useProjectStore';
import { X, Upload, Film, Music, AlignLeft, AlignCenter, AlignRight, ChevronRight, Mic, Plus } from 'lucide-react';
import { mediaService } from '@/lib/media/MediaService';
import { ms } from '@/types/units';
import { generateId } from '@/lib/utils/ids';
import { AssetId, ClipId, ProjectId } from '@/types/identifiers';
import { Asset } from '@/types/schema';

export default function SecondarySidebar() {
  const { activeTab, isSidebarOpen, setIsSidebarOpen } = useEditorStore();

  if (!isSidebarOpen) return null;

  const labels: Record<string, string> = {
    assets: 'Assets',
    text: 'Text',
    captions: 'Captions',
    layers: 'Tracks',
  };

  return (
    <div className="w-[300px] flex-shrink-0 h-full bg-white border-r border-gray-200 flex flex-col animate-in slide-in-from-left duration-200">
      <div className="h-[44px] px-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-gray-900 tracking-tight">{labels[activeTab]}</span>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-gray-900 transition-colors"
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

type AssetFilter = 'all' | 'video' | 'audio' | 'image';

function AssetsPanel() {
  const { assets, id: projectId, addAsset, addClip } = useProjectStore();
  const { setSelectedClipId } = useEditorStore();
  const [filter, setFilter] = useState<AssetFilter>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());

  const filtered = assets.filter(a => filter === 'all' || a.type === filter);

  const counts = {
    all: assets.length,
    video: assets.filter(a => a.type === 'video').length,
    audio: assets.filter(a => a.type === 'audio').length,
    image: assets.filter(a => a.type === 'image').length,
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await mediaService.pickMedia();
      if (!result) return;

      const { handle, metadata } = result;
      const assetId = generateId('asset') as AssetId;

      await addAsset({
        id: assetId,
        handle,
        ...metadata,
      });
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleVerify = async (asset: Asset) => {
    if (!asset.handle) return;
    setVerifyingIds(prev => new Set(prev).add(asset.id));
    try {
      const granted = await mediaService.verifyPermission(asset.handle, true);
      if (granted) {
        // We might want to trigger a metadata re-scan or just force a re-render
        console.log('Permission granted for', asset.name);
      }
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setVerifyingIds(prev => {
        const next = new Set(prev);
        next.delete(asset.id);
        return next;
      });
    }
  };

  const handleAddToTimeline = (asset: Asset) => {
    const trackType = asset.type === 'video' ? 'video' : 'audio';
    const targetTrack = useProjectStore.getState().tracks.find(t => t.type === trackType);
    
    if (targetTrack) {
      const clipId = generateId('clip') as ClipId;
      addClip(targetTrack.id, {
        id: clipId,
        assetId: asset.id,
        startTime: ms(0), // Default to start for now
        duration: asset.duration,
        assetOffset: ms(0),
      });
      setSelectedClipId(clipId);
    }
  };

  const filters: { id: AssetFilter; label: string }[] = [
    { id: 'all',   label: 'All' },
    { id: 'video', label: 'Video' },
    { id: 'audio', label: 'Audio' },
    { id: 'image', label: 'Images' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Filter row */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-200 border ${
              filter === f.id
                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-transparent'
            }`}
          >
            {f.label}
            <span className={`ml-1.5 opacity-50 font-mono ${filter === f.id ? 'text-white' : 'text-gray-400'}`}>
              {counts[f.id]}
            </span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          title="Import media"
        >
          {isImporting ? <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
        </button>
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-300">
              <Film size={20} />
            </div>
            <p className="text-xs font-medium text-gray-900">No {filter} files</p>
            <p className="text-[10px] text-gray-400 mt-1 max-w-[160px] mx-auto">
              Link your local video and audio files to start editing.
            </p>
            <button 
              onClick={handleImport}
              className="mt-4 text-[11px] font-bold py-2 px-6 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              Import Files
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map(asset => {
              const isVerifying = verifyingIds.has(asset.id);
              return (
                <li
                  key={asset.id}
                  className="group relative flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-default"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${
                    asset.type === 'video'
                      ? 'bg-orange-50 border-orange-100 text-orange-600'
                      : 'bg-sky-50 border-sky-100 text-sky-600'
                  }`}>
                    {asset.type === 'video' ? <Film size={16} /> : <Music size={16} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate pr-4">{asset.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-mono">{(asset.duration / 1000).toFixed(1)}s</span>
                      <span className="text-[10px] text-gray-300">•</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{(asset.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute inset-y-0 right-3 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-gray-50 via-gray-50 pl-4">
                    <button
                      onClick={() => handleAddToTimeline(asset)}
                      title="Add to timeline"
                      className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Unlock warning (simplified for now, real check later) */}
                  {!asset.handle && (
                    <button 
                      onClick={() => handleVerify(asset)}
                      className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100">Unlock permissions</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function TextPanel() {
  const { selectedClipId } = useEditorStore();
  const [fontSize, setFontSize] = useState('32');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);

  if (!selectedClipId) {
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
