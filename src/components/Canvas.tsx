'use client';

import { useRef, useEffect, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useEditorStore } from '@/store/useEditorStore';
import { engine } from '@/lib/engine/EngineService';
import { mediaService } from '@/lib/media/MediaService';
import { formatTimecode } from '@/lib/utils/timecode';
import { ms } from '@/types/units';
import { AlignCenter, Type as TextIcon, RotateCw, Lock, ShieldAlert, Film, Video } from 'lucide-react';

interface CanvasProps {
  projectName: string;
}

export default function Canvas({ projectName }: CanvasProps) {
  const { resolution, fps, assets, tracks } = useProjectStore();
  const { currentTime } = useEditorStore();

  const calculatedDuration = tracks.reduce((max, t) => {
    const trackMax = t.clips.reduce((cMax, c) => Math.max(cMax, Number(c.startTime) + Number(c.duration)), 0);
    return Math.max(max, trackMax);
  }, 0);
  const projectDuration = Math.max(calculatedDuration, 30000);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
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
    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d', { alpha: false });
    }
  }, []);

  const renderBufferRef = useRef<Uint8ClampedArray | null>(null);

  useEffect(() => {
    engine.onFrame((data) => {
      if (!canvasRef.current || !ctxRef.current) return;
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (data instanceof ImageBitmap) {
        ctx.drawImage(data, 0, 0, canvas.width, canvas.height);
        data.close();
        if (!hasFrame) setHasFrame(true);
      } else {
        // Raw pixels from SharedArrayBuffer — stored at Fixed Stride, retrieve the actual video dimensions
        const pixels = data as Uint8ClampedArray;
        const { width, height } = engine.getDimensions();
        const requiredSize = width * height * 4;
        
        // Ensure our non-shared rendering buffer is large enough
        if (!renderBufferRef.current || renderBufferRef.current.length < requiredSize) {
          renderBufferRef.current = new Uint8ClampedArray(requiredSize);
        }
        
        // Copy only the valid pixel data from the shared slot (ignore padding)
        renderBufferRef.current.set(pixels.subarray(0, requiredSize));
        
        // Build ImageData at the native video size, then scale-draw to fill the canvas.
        // putImageData does NOT scale — it draws pixel-perfect at (0,0), leaving black bars.
        const imageData = new ImageData(renderBufferRef.current.subarray(0, requiredSize) as any, width, height);
        createImageBitmap(imageData).then((bitmap) => {
          if (ctx && canvas) {
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            bitmap.close();
          }
        });

        // Mark as having received a frame only after successful render
        if (!hasFrame) setHasFrame(true);
      }
    });
  }, []);

  const lastSeekTimeRef = useRef(0);
  const seekThrottleIdRef = useRef<any>(null);

  useEffect(() => {
    const now = performance.now();
    const timeSinceLastSeek = now - lastSeekTimeRef.current;
    const targetTime = Number(currentTime);

    if (timeSinceLastSeek > 32) {
      engine.seek(targetTime);
      lastSeekTimeRef.current = now;
      if (seekThrottleIdRef.current) clearTimeout(seekThrottleIdRef.current);
    } else {
      if (seekThrottleIdRef.current) clearTimeout(seekThrottleIdRef.current);
      seekThrottleIdRef.current = setTimeout(() => {
        engine.seek(targetTime);
        lastSeekTimeRef.current = performance.now();
      }, 32 - timeSinceLastSeek);
    }

    return () => {
      if (seekThrottleIdRef.current) clearTimeout(seekThrottleIdRef.current);
    };
  }, [currentTime]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative" style={{ background: '#0f0f0f' }}>
      
      {/* Full-background Empty state: no asset added yet */}
      {!hasVideoAsset && !hasFrame && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
          style={{ background: '#0f0f0f' }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, #2a2a2a 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }} />
          <div className="relative flex flex-col items-center gap-3 text-center px-8">
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: '#1e1e1e', border: '1px solid #2e2e2e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}>
              <Film size={28} color="#888" />
            </div>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '8px' }}>
              No Media
            </p>
            <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6 }}>
              Add a video to your timeline<br />to begin editing
            </p>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex items-center justify-center min-h-0 relative z-20" style={{ padding: '24px', opacity: hasVideoAsset ? 1 : 0, pointerEvents: hasVideoAsset ? 'auto' : 'none' }}>
        <div
          className="relative overflow-hidden max-w-full max-h-full"
          style={{
            aspectRatio: `${resolution.width} / ${resolution.height}`,
            width: aspectRatio > 1 ? '100%' : 'auto',
            height: aspectRatio > 1 ? 'auto' : '100%',
          }}
        >
          {/* Empty state: asset exists but no frame yet (loading) */}
          {hasVideoAsset && !hasFrame && !needsPermission && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center"
              style={{ background: '#0a0a0a' }}>
              <div className="flex flex-col items-center gap-3">
                <div style={{ position: 'relative', width: 44, height: 44 }}>
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: '2px solid #2a2a2a',
                    borderTopColor: '#777',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <Video size={18} color="#666" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                </div>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>Indexing video…</p>
              </div>
            </div>
          )}

          {/* The actual canvas — hidden until first frame arrives */}
          <canvas
            ref={canvasRef}
            width={resolution.width}
            height={resolution.height}
            style={{ width: '100%', height: '100%', background: '#000', display: hasFrame ? 'block' : 'none' }}
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
          <span className="font-mono text-[11px] text-[#444]">
            {formatTimecode(ms(projectDuration), fps)}
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
