import { FastForward, Play, Rewind, SkipBack, SkipForward } from 'lucide-react';

interface TimelineProps {
  projectName: string;
}

export default function Timeline({ projectName }: TimelineProps) {
  return (
    <div className="h-64 border-t border-gray-200 bg-white p-4 flex flex-col overflow-hidden">
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Timeline</h3>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-gray-500">00:00:00:00</span>
          {/* Track toggles */}
          <div className="flex gap-2">
            <button className="px-2 py-1 text-xs rounded-sm border border-transparent bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200">
              V
            </button>
            <button className="px-2 py-1 text-xs rounded-sm border border-transparent bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200">
              A
            </button>
            <button className="px-2 py-1 text-xs rounded-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
              T
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="flex-1 relative overflow-hidden rounded-md border border-gray-200 bg-gray-50">
        {/* Ruler */}
        <div className="absolute top-0 left-0 right-0 h-6 border-b border-gray-200 bg-gray-100 flex items-center">
          <div className="flex gap-12 pl-4 text-xs text-gray-400 font-mono">
            <span>0s</span>
            <span>5s</span>
            <span>10s</span>
            <span>15s</span>
          </div>
        </div>

        {/* Tracks */}
        <div className="pt-6 space-y-2 p-2 overflow-y-auto flex-1">
          {/* Video Track */}
          <div className="h-10 bg-orange-50 rounded-sm border border-orange-200 flex items-center px-3">
            <span className="text-xs text-orange-800 font-mono">Video</span>
          </div>

          {/* Audio Track */}
          <div className="h-10 bg-cyan-50 rounded-sm border border-cyan-200 flex items-center px-3">
            <span className="text-xs text-cyan-800 font-mono">Audio</span>
          </div>

          {/* Text/Caption Track */}
          <div className="h-10 bg-blue-50 rounded-sm border border-blue-200 flex items-center px-3">
            <span className="text-xs text-blue-800 font-mono">Captions</span>
          </div>
        </div>

        {/* Playhead */}
        <div className="absolute top-0 left-16 w-[1.5px] h-full bg-red-700 pointer-events-none z-10">
          {/* Playhead handle */}
          <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-700 rounded-sm"></div>
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="mt-3 flex items-center gap-2">
        <button className="p-1.5 text-xs rounded-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100">
          <SkipBack size={16} />
        </button>
        <button className="p-1.5 text-xs rounded-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100">
          <Rewind size={16} />
        </button>
        <button className="px-4 py-1.5 flex items-center gap-1.5 text-sm rounded-md bg-red-700 text-white hover:bg-red-800">
          <Play size={14} className="fill-white" /> Play
        </button>
        <button className="p-1.5 text-xs rounded-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100">
          <FastForward size={16} />
        </button>
        <button className="p-1.5 text-xs rounded-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100">
          <SkipForward size={16} />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom in timeline */}
        <input
          type="range"
          min="50"
          max="200"
          defaultValue="100"
          className="w-24 h-1.5 bg-gray-200 rounded-sm appearance-none cursor-pointer accent-red-700"
          title="Timeline zoom"
        />
      </div>
    </div>
  );
}
