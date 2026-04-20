import { Download, X, AlignCenter, Type as TextIcon, RotateCw } from 'lucide-react';

interface CanvasProps {
  projectName: string;
}

export default function Canvas({ projectName }: CanvasProps) {
  return (
    <div className="flex-1 flex flex-col bg-gray-100 p-8 overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center">
        <div className="group relative w-full max-w-4xl aspect-video rounded-sm border border-gray-300 bg-white overflow-hidden ring-1 ring-gray-900/5">
          {/* Canvas Area */}
          <canvas className="w-full h-full bg-white block" />

          {/* Floating Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white border border-gray-200 rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 z-20">
            {/* Font Size */}
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              <TextIcon size={14} className="text-gray-500" />
              <select className="bg-transparent text-sm font-medium text-gray-900 outline-none w-12 cursor-pointer hover:text-red-700">
                <option>12</option>
                <option>18</option>
                <option>24</option>
                <option>32</option>
                <option>48</option>
              </select>
            </div>

            {/* Alignment */}
            <button className="p-1 hover:bg-gray-100 rounded-md group/btn" title="Center Text">
              <AlignCenter size={16} className="text-gray-500 group-hover/btn:text-gray-900" />
            </button>

            {/* Rotation */}
            <button className="p-1 hover:bg-gray-100 rounded-md group/btn" title="Rotate">
              <RotateCw size={16} className="text-gray-500 group-hover/btn:text-gray-900" />
            </button>
          </div>

          {/* Zoom Controls (Bottom Right) */}
          <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-white border border-gray-200 rounded-md px-3 py-2 opacity-0 group-hover:opacity-100 z-20">
            <input
              type="range"
              min="10"
              max="200"
              defaultValue="100"
              className="w-24 h-1.5 bg-gray-200 rounded-sm appearance-none cursor-pointer accent-red-700 hover:accent-red-600"
            />
            <span className="text-xs font-medium text-gray-600 w-8 text-right font-mono">100%</span>
          </div>

          {/* Transform Handles (Placeholder) */}
          <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 z-10">
            <div className="w-3 h-3 border border-red-700 bg-white cursor-nwse-resize" title="Resize" />
          </div>
        </div>
      </div>

      {/* Canvas Info */}
      <div className="mt-5 flex items-center justify-between text-xs px-4">
        <span className="bg-white border border-gray-200 text-gray-600 font-mono px-2 py-1 rounded-sm">1920 × 1080 @ 30fps</span>
        <span className="bg-white border border-gray-200 text-gray-600 font-mono px-2 py-1 rounded-sm">00:00:00 / 00:12:34</span>
      </div>
    </div>
  );
}
