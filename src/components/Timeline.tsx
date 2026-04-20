interface TimelineProps {
  projectName: string;
}

export default function Timeline({ projectName }: TimelineProps) {
  return (
    <div className="h-64 border-t border-zinc-800 bg-zinc-950 p-4 flex flex-col overflow-hidden">
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Timeline</h3>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-zinc-500">00:00:00:00</span>
          {/* Track toggles */}
          <div className="flex gap-2">
            <button className="px-2 py-1 text-xs rounded bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
              V
            </button>
            <button className="px-2 py-1 text-xs rounded bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
              A
            </button>
            <button className="px-2 py-1 text-xs rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors">
              T
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="flex-1 relative overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/30">
        {/* Ruler */}
        <div className="absolute top-0 left-0 right-0 h-6 border-b border-zinc-800 bg-zinc-900/50 flex items-center">
          <div className="flex gap-12 pl-4 text-xs text-zinc-600 font-mono">
            <span>0s</span>
            <span>5s</span>
            <span>10s</span>
            <span>15s</span>
          </div>
        </div>

        {/* Tracks */}
        <div className="pt-6 space-y-2 p-2 overflow-y-auto flex-1">
          {/* Video Track */}
          <div className="h-12 bg-gradient-to-r from-orange-600/20 to-orange-600/10 rounded border border-orange-800/30 flex items-center px-2">
            <span className="text-xs text-orange-400 font-mono">Video</span>
          </div>

          {/* Audio Track */}
          <div className="h-12 bg-gradient-to-r from-cyan-600/20 to-cyan-600/10 rounded border border-cyan-800/30 flex items-center px-2">
            <span className="text-xs text-cyan-400 font-mono">Audio</span>
          </div>

          {/* Text/Caption Track */}
          <div className="h-12 bg-gradient-to-r from-blue-600/20 to-blue-600/10 rounded border border-blue-800/30 flex items-center px-2">
            <span className="text-xs text-blue-400 font-mono">Captions</span>
          </div>
        </div>

        {/* Playhead */}
        <div className="absolute top-0 left-16 w-0.5 h-full bg-red-500 pointer-events-none shadow-lg shadow-red-500/50" />
      </div>

      {/* Timeline Controls */}
      <div className="mt-3 flex items-center gap-2">
        <button className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
          ⏮ Start
        </button>
        <button className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
          ⏪
        </button>
        <button className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          ▶ Play
        </button>
        <button className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
          ⏩
        </button>
        <button className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
          End ⏭
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom in timeline */}
        <input
          type="range"
          min="50"
          max="200"
          defaultValue="100"
          className="w-20 h-1"
          title="Timeline zoom"
        />
      </div>
    </div>
  );
}
