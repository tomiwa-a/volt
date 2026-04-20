import { Download, X, AlignCenter, Type as TextIcon, RotateCw } from 'lucide-react';

interface CanvasProps {
  projectName: string;
}

export default function Canvas({ projectName }: CanvasProps) {
  return (
    <div className="flex-1 flex flex-col bg-black/40 p-8 overflow-hidden">
      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center">
        <div className="group relative w-full max-w-4xl aspect-video rounded-lg border border-zinc-800 bg-black shadow-2xl overflow-hidden">
          {/* Canvas Area */}
          <canvas className="w-full h-full bg-black" />

          {/* Floating Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Font Size */}
            <div className="flex items-center gap-1 border-r border-zinc-700 pr-2">
              <TextIcon size={14} className="text-zinc-400" />
              <select className="bg-transparent text-sm text-white outline-none w-12">
                <option>12</option>
                <option>18</option>
                <option>24</option>
                <option>32</option>
                <option>48</option>
              </select>
            </div>

            {/* Alignment */}
            <button className="p-1 hover:bg-zinc-800 rounded transition-colors" title="Center Text">
              <AlignCenter size={14} className="text-zinc-400 hover:text-white" />
            </button>

            {/* Rotation */}
            <button className="p-1 hover:bg-zinc-800 rounded transition-colors" title="Rotate">
              <RotateCw size={14} className="text-zinc-400 hover:text-white" />
            </button>
          </div>

          {/* Zoom Controls (Bottom Right) */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <input
              type="range"
              min="10"
              max="200"
              defaultValue="100"
              className="w-24 h-1"
            />
            <span className="text-xs text-zinc-400 w-8 text-right">100%</span>
          </div>

          {/* Transform Handles (Placeholder) */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-3 h-3 border border-blue-500 rounded-full cursor-nwse-resize bg-blue-600/50" />
          </div>
        </div>
      </div>

      {/* Canvas Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 px-4">
        <span className="font-mono">1920 × 1080 @ 30fps</span>
        <span className="font-mono">0:00 / 12:34</span>
      </div>
    </div>
  );
}
