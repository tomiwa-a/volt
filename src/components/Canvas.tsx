'use client';

import { useRef, useEffect, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useEditorStore } from '@/store/useEditorStore';
import { engine } from '@/lib/engine/EngineService';
import { mediaService } from '@/lib/media/MediaService';
import { formatTimecode } from '@/lib/utils/timecode';
import { AlignCenter, Type as TextIcon, RotateCw, Lock, ShieldAlert, Film, Video } from 'lucide-react';

interface CanvasProps {
  projectName: string;
}

export default function Canvas({ projectName }: CanvasProps) {
  const { resolution, fps, assets } = useProjectStore();
  const { currentTime, duration } = useEditorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);

  const aspectRatio = Number(resolution.width) / Number(resolution.height);
  const hasVideoAsset = assets.some(a => a.type === 'video');

  const loadMediaToEngine = async () => {
    const firstVideo = assets.find(a => a.type === 'video');
    if (!firstVideo?.handle) return;

    try {
      const file = await firstVideo.handle.getFile();
      await engine.loadFile(file);
      engine.seek(Number(currentTime));
      setNeedsPermission(false);
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') {
        setNeedsPermission(true);
      }
      console.warn('[Canvas] Auto-load failed:', err);
    }
  };

  useEffect(() => {
    loadMediaToEngine();
  }, [assets]);

  const handleReconnect = async () => {
    const firstVideo = assets.find(a => a.type === 'video');
    if (!firstVideo?.handle) return;
    const granted = await mediaService.verifyPermission(firstVideo.handle, true);
    if (granted) loadMediaToEngine();
  };

  useEffect(() => {
    engine.onFrame((bitmap) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      setHasFrame(true);
    });
  }, []);

  useEffect(() => {
    engine.seek(Number(currentTime));
  }, [currentTime]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0" style={{ background: '#0f0f0f' }}>
      <div className="flex-1 flex items-center justify-center p-6 min-h-0 relative">
        <div
          className="group relative shadow-2xl overflow-hidden max-w-full max-h-full"
          style={{
            aspectRatio: `${resolution.width} / ${resolution.height}`,
            width: aspectRatio > 1 ? '100%' : 'auto',
            height: aspectRatio > 1 ? 'auto' : '100%',
            borderRadius: '4px',
          }}
        >
          {/* Empty state: no asset added yet */}
          {!hasVideoAsset && !hasFrame && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)' }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                backgroundSize: '24px 24px', opacity: 0.4
              }} />
              <div className="relative flex flex-col items-center gap-3 text-center px-8">
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
                  border: '1px solid #333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Film size={24} color="#666" />
                </div>
                <p style={{ color: '#555', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  No Media
                </p>
                <p style={{ color: '#444', fontSize: 11, lineHeight: 1.5 }}>
                  Add a video to your timeline<br />to begin editing
                </p>
              </div>
            </div>
          )}

          {/* Empty state: asset exists but no frame yet (loading) */}
          {hasVideoAsset && !hasFrame && !needsPermission && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center"
              style={{ background: '#111' }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle, #222 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
              <div className="relative flex flex-col items-center gap-3">
                <div style={{ position: 'relative', width: 40, height: 40 }}>
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: '2px solid #333',
                    borderTopColor: '#666',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <Video size={16} color="#555" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                </div>
                <p style={{ color: '#555', fontSize: 11 }}>Indexing video…</p>
              </div>
            </div>
          )}

          {/* The actual canvas — always rendered, hidden behind empty states */}
          <canvas
            ref={canvasRef}
            width={resolution.width}
            height={resolution.height}
            className="w-full h-full block"
            style={{ background: '#000', display: hasFrame ? 'block' : 'none' }}
          />

          {/* Permission Fallback UI */}
          {needsPermission && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
              <div style={{
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                borderRadius: 16, padding: '24px', maxWidth: 280,
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(251,146,60,0.1)',
                  border: '1px solid rgba(251,146,60,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
                }}>
                  <Lock size={20} color="#f97316" />
                </div>
                <p style={{ color: '#e5e5e5', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Media Access Required
                </p>
                <p style={{ color: '#666', fontSize: 11, lineHeight: 1.6, marginBottom: 20 }}>
                  Browser security requires a click to re-open local files after a refresh.
                </p>
                <button
                  onClick={handleReconnect}
                  style={{
                    width: '100%', padding: '10px 16px',
                    background: '#f97316', color: 'white',
                    border: 'none', borderRadius: 10, cursor: 'pointer',
                    fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  <ShieldAlert size={14} />
                  Restore Access
                </button>
              </div>
            </div>
          )}

          {/* Floating canvas toolbar */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 z-20 transition-opacity"
            style={{ background: 'rgba(20,20,20,0.9)', border: '1px solid #333', borderRadius: 8, padding: '4px 8px' }}>
            <div className="flex items-center gap-1" style={{ borderRight: '1px solid #333', paddingRight: 8 }}>
              <TextIcon size={13} color="#888" />
              <select className="bg-transparent text-xs font-medium outline-none cursor-pointer" style={{ color: '#ccc', width: 40 }}>
                <option>12</option>
                <option>18</option>
                <option>24</option>
                <option>32</option>
                <option>48</option>
              </select>
            </div>
            <button className="p-1 rounded transition-colors hover:bg-white/10" title="Center Text">
              <AlignCenter size={14} color="#888" />
            </button>
            <button className="p-1 rounded transition-colors hover:bg-white/10" title="Rotate">
              <RotateCw size={14} color="#888" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 z-20 transition-opacity"
            style={{ background: 'rgba(20,20,20,0.9)', border: '1px solid #333', borderRadius: 8, padding: '6px 10px' }}>
            <input type="range" min="10" max="200" defaultValue="100"
              className="w-16 h-1 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#888' }}
            />
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#666', width: 32, textAlign: 'right', fontWeight: 700 }}>100%</span>
          </div>
        </div>
      </div>

      {/* Info strip */}
      <div style={{ height: 36, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#666' }}>{resolution.width} × {resolution.height}</span>
          <span style={{ color: '#2a2a2a' }}>|</span>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#444' }}>{fps} FPS</span>
          {hasFrame && (
            <>
              <span style={{ color: '#2a2a2a' }}>|</span>
              <span style={{ fontSize: 10, color: '#3a7c3a', fontWeight: 600 }}>● Live</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#888', fontWeight: 700 }}>
            {formatTimecode(currentTime, fps)}
          </span>
          <span style={{ color: '#2a2a2a' }}>/</span>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#444' }}>
            {formatTimecode(duration, fps)}
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
