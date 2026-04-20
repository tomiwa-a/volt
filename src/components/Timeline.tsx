import { useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import {
  Play, Pause, SkipBack, SkipForward,
  Rewind, FastForward, Maximize2, ChevronDown, ChevronUp,
} from 'lucide-react';

interface TimelineProps {
  projectName: string;
}

const TRACKS = [
  { id: 'video',    label: 'Video',    bg: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-700' },
  { id: 'audio',    label: 'Audio',    bg: 'bg-sky-50',     border: 'border-sky-200',    text: 'text-sky-700'    },
  { id: 'captions', label: 'Captions', bg: 'bg-violet-50',  border: 'border-violet-200', text: 'text-violet-700' },
];

const RULER_MARKS = ['0:00', '0:05', '0:10', '0:15', '0:20', '0:25', '0:30'];

export default function Timeline({ projectName }: TimelineProps) {
  const { 
    isPlaying, 
    togglePlayback, 
    showStats, 
    setShowStats, 
    isTimelineCollapsed: isCollapsed, 
    setIsTimelineCollapsed: setIsCollapsed 
  } = useEditorStore();

  const [mutedTracks, setMutedTracks] = useState<Set<string>>(new Set());

  const toggleTrackMute = (id: string) => {
    setMutedTracks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white flex flex-col">

      {/* ── Header bar ── */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Timeline</span>
          <button
            onClick={() => setShowStats(!showStats)}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
              showStats
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            stats
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Timecode */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-500">
            <span className="text-gray-900 font-semibold">00:00:00:00</span>
            <span className="text-gray-300">/</span>
            <span>00:12:34:00</span>
            <span className="ml-1 text-gray-300 font-sans">·</span>
            <span>30 fps</span>
          </div>

          {/* Track visibility toggles */}
          <div className="flex items-center gap-1">
            {TRACKS.map(t => (
              <button
                key={t.id}
                title={`Toggle ${t.label} track`}
                onClick={() => toggleTrackMute(t.id)}
                className={`text-[10px] font-bold w-6 h-6 rounded flex items-center justify-center border transition-colors ${
                  mutedTracks.has(t.id)
                    ? 'border-gray-200 text-gray-300 bg-gray-50'
                    : `${t.border} ${t.text} ${t.bg}`
                }`}
              >
                {t.label[0]}
              </button>
            ))}
          </div>

          {/* Fullscreen */}
          <button
            title="Fullscreen timeline"
            className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <Maximize2 size={14} />
          </button>

          {/* Collapse toggle */}
          <button
            title={isCollapsed ? 'Expand timeline' : 'Collapse timeline'}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ── Stats for nerds ── */}
      {showStats && !isCollapsed && (
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-6 flex-shrink-0">
          {[
            ['Frame', '0 / 22,620'],
            ['Decode', '2.1 ms'],
            ['Composite', '0.8 ms'],
            ['Buffer', '64 MB'],
            ['Engine', 'idle'],
            ['SAB', 'active'],
          ].map(([label, val]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 font-semibold">{label}</span>
              <span className="text-[10px] font-mono text-gray-700">{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Track area ── */}
      {!isCollapsed && (
        <div className="flex flex-col" style={{ height: 148 }}>
          {/* Ruler */}
          <div className="flex-shrink-0 h-6 border-b border-gray-100 bg-gray-50 flex items-center overflow-hidden">
            <div className="flex pl-2 gap-0 w-full">
              {RULER_MARKS.map((m, i) => (
                <div key={m} className="flex-1 flex items-center">
                  <span className="text-[10px] font-mono text-gray-400">{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {TRACKS.filter(t => !mutedTracks.has(t.id)).map(t => (
              <div key={t.id} className="flex items-stretch h-11">
                {/* Track label */}
                <div className="w-16 flex-shrink-0 flex items-center px-2.5 border-r border-gray-100">
                  <span className={`text-[10px] font-bold ${t.text}`}>{t.label}</span>
                </div>
                {/* Clip area */}
                <div className="flex-1 px-1 py-1.5 bg-gray-50 relative">
                  <div className={`h-full rounded ${t.bg} border ${t.border} flex items-center px-2`}>
                    <span className={`text-[10px] font-mono ${t.text} opacity-70`}>{projectName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Playback controls ── */}
      <div className="h-11 px-4 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
        <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
          <SkipBack size={15} />
        </button>
        <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
          <Rewind size={15} />
        </button>

        <button
          onClick={togglePlayback}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold transition-colors"
        >
          {isPlaying
            ? <Pause size={13} className="fill-white" />
            : <Play size={13} className="fill-white" />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
          <FastForward size={15} />
        </button>
        <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
          <SkipForward size={15} />
        </button>

        <div className="flex-1" />

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-gray-400">Zoom</span>
          <input
            type="range"
            min="50"
            max="300"
            defaultValue="100"
            className="w-20 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
            title="Timeline zoom"
          />
        </div>
      </div>
    </div>
  );
}
