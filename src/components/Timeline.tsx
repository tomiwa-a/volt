import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { useProjectStore } from '@/store/useProjectStore';
import { engine } from '@/lib/engine/EngineService';
import { formatTimecode } from '@/lib/utils/timecode';
import { TrackType, TrackStyle } from '@/types/schema';
import { ms } from '@/types/units';
import { msToPx, pxToMs } from '@/lib/utils/coordinates';
import {
  Play, Pause, SkipBack, SkipForward,
  Rewind, FastForward, Maximize2, ChevronDown, ChevronUp,
} from 'lucide-react';

interface TimelineProps {
  projectName: string;
}

const TRACK_METADATA: Record<TrackType, TrackStyle> = {
  video: { label: 'Video',    bg: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-700' },
  audio: { label: 'Audio',    bg: 'bg-sky-50',     border: 'border-sky-200',    text: 'text-sky-700'    },
  captions: { label: 'Captions', bg: 'bg-violet-50',  border: 'border-violet-200', text: 'text-violet-700' },
};

export default function Timeline({ projectName }: TimelineProps) {
  const { 
    isPlaying, 
    togglePlayback, 
    showStats, 
    setShowStats, 
    isTimelineCollapsed: isCollapsed, 
    setIsTimelineCollapsed: setIsCollapsed,
    zoomLevel,
    setZoomLevel,
    currentTime
  } = useEditorStore();

  // Ref for the track area container to measure mouse positions
  const trackAreaRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);
  const lastTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | undefined>(undefined);

  const { tracks, fps, assets } = useProjectStore();

  const [mutedTracks, setMutedTracks] = useState<Set<string>>(new Set());
  const [engineStatus, setEngineStatus] = useState('initializing');

  // Utility to calculate time from a clientX coordinate
  const getTimeFromX = useCallback((clientX: number) => {
    if (!trackAreaRef.current) return ms(0);
    const rect = trackAreaRef.current.getBoundingClientRect();
    const x = clientX - rect.left - 64; // Subtract track label column width
    return pxToMs(Math.max(0, x), zoomLevel);
  }, [zoomLevel]);

  // Scrubbing handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isScrubbingRef.current = true;
    const newTime = getTimeFromX(e.clientX);
    useEditorStore.getState().setCurrentTime(newTime, fps);
    
    // Add global move/up listeners to handle dragging outside the element
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!isScrubbingRef.current) return;
    const newTime = getTimeFromX(e.clientX);
    useEditorStore.getState().setCurrentTime(newTime, fps);
  };

  const handleGlobalMouseUp = () => {
    isScrubbingRef.current = false;
    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
  };

  // Playback Loop
  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== null) {
      const delta = time - lastTimeRef.current;
      const state = useEditorStore.getState();
      
      if (state.isPlaying) {
        const nextTime = ms(Number(state.currentTime) + delta);
        state.setCurrentTime(nextTime, fps);
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [fps]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  useEffect(() => {
    if (showStats) {
      const interval = setInterval(() => {
        const stats = engine.getStats();
        if (stats) {
          setEngineStatus(stats.status);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showStats]);

  const toggleTrackMute = (id: string) => {
    setMutedTracks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Generate ruler marks based on zoom
  const rulerMarks = Array.from({ length: 11 }, (_, i) => {
    const time = i * 5000; // Every 5 seconds
    return {
      time,
      label: `${Math.floor(time / 1000)}s`,
      left: msToPx(ms(time), zoomLevel)
    };
  });

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
            <span className="text-gray-900 font-semibold">{formatTimecode(currentTime, fps)}</span>
            <span className="text-gray-300">/</span>
            <span>00:00:30:00</span>
            <span className="ml-1 text-gray-300 font-sans">·</span>
            <span>{fps} fps</span>
          </div>

          {/* Track visibility toggles */}
          <div className="flex items-center gap-1">
            {tracks.map(t => {
              const meta = TRACK_METADATA[t.type];
              return (
                <button
                  key={t.id}
                  title={`Toggle ${meta.label} track`}
                  onClick={() => toggleTrackMute(t.id)}
                  className={`text-[10px] font-bold w-6 h-6 rounded flex items-center justify-center border transition-colors ${
                    mutedTracks.has(t.id)
                      ? 'border-gray-200 text-gray-300 bg-gray-50'
                      : `${meta.border} ${meta.text} ${meta.bg}`
                  }`}
                >
                  {meta.label[0]}
                </button>
              );
            })}
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
            ['Engine', engineStatus],
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
        <div 
          ref={trackAreaRef}
          onMouseDown={handleMouseDown}
          className="flex flex-col relative select-none" 
          style={{ height: 180 }}
        >
          {/* Ruler */}
          <div className="flex-shrink-0 h-6 border-b border-gray-100 bg-gray-50 flex items-center relative overflow-hidden">
            <div className="absolute inset-0 pl-16">
              {rulerMarks.map((m) => (
                <div 
                  key={m.time} 
                  className="absolute top-0 bottom-0 border-l border-gray-200"
                  style={{ left: msToPx(ms(m.time), zoomLevel) }}
                >
                  <span className="text-[9px] font-mono text-gray-400 ml-1 mt-1 block">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks container */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {tracks.filter(t => !mutedTracks.has(t.id)).map(t => {
              const meta = TRACK_METADATA[t.type];
              return (
                <div key={t.id} className="flex items-stretch h-12">
                  {/* Track label */}
                  <div className="w-16 flex-shrink-0 flex items-center px-2.5 border-r border-gray-100 bg-white sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                    <span className={`text-[10px] font-bold ${meta.text}`}>{meta.label}</span>
                  </div>
                  {/* Clip area */}
                  <div className="flex-1 relative bg-gray-50 group/track">
                    {/* Grid lines (simplified) */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundSize: `${msToPx(ms(1000), zoomLevel)}px 100%`, backgroundImage: 'linear-gradient(to right, #ccc 1px, transparent 1px)' }} />
                    
                    {t.clips.map(clip => {
                      const asset = assets.find(a => a.id === clip.assetId);
                      return (
                        <div
                          key={clip.id}
                          className={`absolute inset-y-1 rounded border shadow-sm flex items-center px-2 min-w-[20px] cursor-pointer group/clip ${meta.bg} ${meta.border} transition-transform active:scale-[0.99]`}
                          style={{
                            left: msToPx(clip.startTime, zoomLevel),
                            width: msToPx(clip.duration, zoomLevel),
                          }}
                        >
                          <span className={`text-[10px] font-bold truncate ${meta.text}`}>
                            {asset?.name || 'Missing Asset'}
                          </span>
                          
                          {/* Handles (for visual only now) */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 group-hover/clip:bg-white/50 cursor-ew-resize" />
                          <div className="absolute right-0 top-0 bottom-0 w-1 group-hover/clip:bg-white/50 cursor-ew-resize" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Time Indicator (Playhead) */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-red-600 z-20 pointer-events-none"
            style={{ left: 64 + msToPx(currentTime, zoomLevel) }}
          >
            <div className="absolute -top-1 -left-[5px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-red-600" />
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
          <span className="text-[10px] font-semibold text-gray-400 tracking-tight">Zoom</span>
          <input
            type="range"
            min="10"
            max="400"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseInt(e.target.value))}
            className="w-24 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
            title="Timeline zoom"
          />
          <span className="text-[10px] font-mono text-gray-400 w-8">{zoomLevel}%</span>
        </div>
      </div>
    </div>
  );
}
