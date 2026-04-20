import { AlignCenter, Type as TextIcon, RotateCw } from 'lucide-react';

interface CanvasProps {
  projectName: string;
}

export default function Canvas({ projectName }: CanvasProps) {
  return (
    <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] min-h-0">
      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
        <div className="group relative w-full max-w-4xl aspect-video rounded-sm border border-gray-300 bg-white overflow-hidden ring-1 ring-gray-900/5">
          {/* Canvas Area */}
          <canvas className="w-full h-full bg-white block" />

          {/* Floating Toolbar */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white border border-gray-200 rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 z-20 transition-opacity shadow-sm">
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              <TextIcon size={13} className="text-gray-400" />
              <select className="bg-transparent text-xs font-medium text-gray-900 outline-none w-10 cursor-pointer">
                <option>12</option>
                <option>18</option>
                <option>24</option>
                <option>32</option>
                <option>48</option>
              </select>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded" title="Center Text">
              <AlignCenter size={14} className="text-gray-500" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded" title="Rotate">
              <RotateCw size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Zoom Controls (Bottom Right) */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white/90 border border-gray-200 rounded-md px-2.5 py-1.5 opacity-0 group-hover:opacity-100 z-20 transition-opacity shadow-sm">
            <input
              type="range"
              min="10"
              max="200"
              defaultValue="100"
              className="w-20 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
            />
            <span className="text-[10px] font-mono text-gray-500 w-8 text-right">100%</span>
          </div>
        </div>
      </div>

      {/* Canvas Info strip */}
      <div className="h-9 px-6 flex items-center justify-between text-[11px] bg-gray-100 border-t border-gray-200 flex-shrink-0">
        <span className="font-mono text-gray-500">1920 × 1080 · 30 fps</span>
        <span className="font-mono text-gray-500">
          <span className="text-gray-900 font-semibold">00:00:00</span>
          <span className="text-gray-400"> / 00:12:34</span>
        </span>
      </div>
    </div>
  );
}
