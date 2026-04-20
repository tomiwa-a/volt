'use client';

import { useState } from 'react';
import { X, Download } from 'lucide-react';

interface ExportModalProps {
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

type Format = 'mp4' | 'webm';
type Resolution = '720p' | '1080p' | '4k';
type FPS = '24' | '30' | '60';

export default function ExportModal({ projectName, isOpen, onClose }: ExportModalProps) {
  const [filename, setFilename] = useState(projectName.toLowerCase().replace(/\s+/g, '_'));
  const [format, setFormat] = useState<Format>('mp4');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [fps, setFps] = useState<FPS>('30');
  const [quality, setQuality] = useState(80);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const qualityLabel = quality < 40 ? 'Low' : quality < 75 ? 'Medium' : 'High';

  const handleExport = () => {
    setIsExporting(true);
    // Phase 4: will trigger the render loop
    setTimeout(() => {
      setIsExporting(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Export</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Filename */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Filename</label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 focus-within:border-gray-900 focus-within:bg-white transition-colors">
              <input
                type="text"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                className="flex-1 px-3 py-2.5 text-xs outline-none bg-transparent"
              />
              <span className="px-3 text-[11px] font-semibold text-gray-400 border-l border-gray-200">.{format}</span>
            </div>
          </div>

          {/* Format */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Format</label>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              {(['mp4', 'webm'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    format === f
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Resolution</label>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              {(['720p', '1080p', '4k'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                    resolution === r
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {r === '4k' ? '4K' : r}
                </button>
              ))}
            </div>
          </div>

          {/* FPS */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Frame Rate</label>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              {(['24', '30', '60'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFps(f)}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                    fps === f
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {f} fps
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Quality</label>
              <span className="text-[10px] font-semibold text-gray-600">{qualityLabel} — {quality}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={e => setQuality(Number(e.target.value))}
              className="w-full h-1.5 appearance-none bg-gray-200 rounded-full accent-gray-900 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            {resolution} · {fps}fps · {format.toUpperCase()}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || !filename}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isExporting ? (
                <span className="animate-pulse">Rendering…</span>
              ) : (
                <>
                  <Download size={13} />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
