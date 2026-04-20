import { Scissors, Video, Type, Download, Settings } from 'lucide-react';

export default function Page() {
  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex h-12 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-2 font-bold tracking-tighter">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
            <Video size={14} className="text-white" />
          </div>
          VOLT
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-700 transition-colors">
            <Download size={14} />
            Export
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="flex w-14 flex-col items-center border-r border-zinc-800 py-4 gap-6 bg-zinc-900/50">
          <button className="text-zinc-400 hover:text-white transition-colors" title="Media">
            <Video size={20} />
          </button>
          <button className="text-zinc-400 hover:text-white transition-colors" title="Cut">
            <Scissors size={20} />
          </button>
          <button className="text-zinc-400 hover:text-white transition-colors" title="Text">
            <Type size={20} />
          </button>
          <div className="mt-auto">
            <button className="text-zinc-400 hover:text-white transition-colors" title="Settings">
              <Settings size={20} />
            </button>
          </div>
        </nav>

        {/* Workspace */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center bg-black/40 p-8 shadow-inner">
            <div className="aspect-video w-full max-w-4xl rounded-lg border border-zinc-800 bg-black flex items-center justify-center text-zinc-600 overflow-hidden relative group">
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm font-mono tracking-widest uppercase">Canvas Preview</p>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/80 backdrop-blur px-4 py-2 rounded-full border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
                 {/* Playback Controls Placeholder */}
                 <div className="h-2 w-2 rounded-full bg-zinc-500"></div>
                 <div className="h-2 w-2 rounded-full bg-zinc-500"></div>
                 <div className="h-2 w-2 rounded-full bg-zinc-500"></div>
              </div>
            </div>
          </div>

          {/* Timeline Area Placeholder */}
          <div className="h-64 border-t border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Timeline</h3>
               <span className="text-xs font-mono text-zinc-500">00:00:00:00</span>
            </div>
            <div className="h-32 w-full rounded-md border border-zinc-800 bg-zinc-900/30 flex items-center justify-center">
               <p className="text-xs text-zinc-600">No media selected. Use the Sidebar to import video.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
