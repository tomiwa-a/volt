import { useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useEditorStore } from '@/store/useEditorStore';
import { engine } from '@/lib/engine/EngineService';
import { formatTimecode } from '@/lib/utils/timecode';
import { AlignCenter, Type as TextIcon, RotateCw } from 'lucide-react';

interface CanvasProps {
  projectName: string;
}

export default function Canvas({ projectName }: CanvasProps) {
  const { resolution, fps, assets, tracks } = useProjectStore();
  const { currentTime, duration } = useEditorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const aspectRatio = Number(resolution.width) / Number(resolution.height);

  useEffect(() => {
    const firstVideo = assets.find(a => a.type === 'video');
    if (firstVideo?.handle) {
      firstVideo.handle.getFile().then(file => {
        engine.loadFile(file);
        engine.seek(Number(currentTime));
      });
    }
  }, [assets]);

  useEffect(() => {
    engine.onFrame((bitmap) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    });
  }, []);

  useEffect(() => {
    engine.seek(Number(currentTime));
  }, [currentTime]);

  return (
    <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] min-h-0">
      <div className="flex-1 flex items-center justify-center p-6 min-h-0 relative">
        <div 
          className="group relative shadow-2xl rounded-sm border border-gray-300 bg-white overflow-hidden ring-1 ring-gray-900/5 max-w-full max-h-full"
          style={{ 
            aspectRatio: `${resolution.width} / ${resolution.height}`,
            width: aspectRatio > 1 ? '100%' : 'auto',
            height: aspectRatio > 1 ? 'auto' : '100%',
          }}
        >
          <canvas 
            ref={canvasRef}
            width={resolution.width}
            height={resolution.height}
            className="w-full h-full bg-black block" 
          />
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
          <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white/90 border border-gray-200 rounded-md px-2.5 py-1.5 opacity-0 group-hover:opacity-100 z-20 transition-opacity shadow-sm">
            <input
              type="range"
              min="10"
              max="200"
              defaultValue="100"
              className="w-16 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
            />
            <span className="text-[9px] font-mono text-gray-500 w-8 text-right font-bold">100%</span>
          </div>
        </div>
      </div>
      <div className="h-9 px-6 flex items-center justify-between text-[10px] bg-white border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold text-gray-900">{resolution.width} × {resolution.height}</span>
          <span className="text-gray-300">|</span>
          <span className="font-mono text-gray-400">{fps} FPS</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400 italic">No Processing Engine</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-gray-900 font-bold">
            {formatTimecode(currentTime, fps)}
          </span>
          <span className="text-gray-300">/</span>
          <span className="font-mono text-gray-400">
            {formatTimecode(duration, fps)}
          </span>
        </div>
      </div>
    </div>
  );
}
