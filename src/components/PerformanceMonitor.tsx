import React, { useEffect, useRef, useState } from 'react';
import { telemetry } from '@/lib/engine/Telemetry';
import { Activity, Gauge, Zap, LayoutGrid, Timer, Camera, X, Maximize2, Minimize2 } from 'lucide-react';

export const PerformanceMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [metrics, setMetrics] = useState(telemetry.getSummary());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const summary = telemetry.getSummary();
      setMetrics(summary);
      renderCharts();
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible]);

  const renderCharts = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rawData = telemetry.getMetrics();
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    ctx.clearRect(0, 0, width, height);

    // Chart 1: Latency (Top Half)
    drawSparkline(ctx, rawData.decodeLatency, 0, height / 2 - 10, '#3b82f6', 100); // 100ms max
    
    // Chart 2: Jitter (Bottom Half)
    drawSparkline(ctx, rawData.jitter, height / 2 + 10, height - 5, '#f97316', 50); // 50ms max
  };

  const drawSparkline = (ctx: CanvasRenderingContext2D, data: number[], top: number, bottom: number, color: string, maxY: number) => {
    if (data.length < 2) return;
    const h = bottom - top;
    const w = ctx.canvas.width;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    
    for (let i = 0; i < data.length; i++) {
        const x = (i / 200) * w;
        const normalized = Math.min(data[i], maxY) / maxY;
        const y = bottom - (normalized * h);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill area
    ctx.lineTo(w, bottom);
    ctx.lineTo(0, bottom);
    ctx.fillStyle = color + '11';
    ctx.fill();
  };

  const takeSnapshot = () => {
    setSnapshot(telemetry.getSummary());
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-24 right-6 z-50 bg-[#1a1a1a] border border-[#2a2a2a] p-3 rounded-full hover:bg-[#252525] transition-colors"
        title="Show Volt Monitor"
      >
        <Activity size={20} className="text-orange-500" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 w-80 bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden backdrop-filter backdrop-blur-xl bg-opacity-90">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-orange-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#888]">Volt Monitor</span>
        </div>
        <button onClick={() => setIsVisible(false)} className="text-[#555] hover:text-white">
          <X size={16} />
        </button>
      </div>

      {/* Real-time Charts */}
      <div className="p-4 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-tighter text-[#555]">Decode Latency & Jitter</span>
            <span className="text-[10px] text-[#333]">Last 200 samples</span>
        </div>
        <canvas 
          ref={canvasRef} 
          width={280} 
          height={80} 
          className="w-full bg-[#050505] rounded-lg border border-[#1a1a1a]"
        />
      </div>

      {/* Metrics Grid */}
      <div className="p-4 space-y-4">
        <MetricRow 
            icon={<Timer size={14} />} 
            label="Latency" 
            val={metrics.decodeLatency.avg} 
            p99={metrics.decodeLatency.p99}
            unit="ms"
            snapshot={snapshot?.decodeLatency.avg}
        />
        <MetricRow 
            icon={<Zap size={14} />} 
            label="Jitter" 
            val={metrics.jitter.avg} 
            p99={metrics.jitter.p99}
            unit="ms"
            snapshot={snapshot?.jitter.avg}
        />
        <MetricRow 
            icon={<LayoutGrid size={14} />} 
            label="SAB Buffer" 
            val={metrics.bufferCount.avg} 
            max={30}
            unit="f"
            snapshot={snapshot?.bufferCount.avg}
        />
      </div>

      {/* Footer / Snapshot */}
      <div className="p-4 bg-[#0d0d0d] flex items-center justify-between">
        <button 
            onClick={takeSnapshot}
            className="flex items-center gap-2 text-[10px] font-bold uppercase text-orange-500 hover:text-orange-400"
        >
            <Camera size={12} />
            Capture Snapshot
        </button>
        {snapshot && (
            <span className="text-[10px] text-[#555]">Baseline Saved</span>
        )}
      </div>
    </div>
  );
};

const MetricRow = ({ icon, label, val, p99, max, unit, snapshot }: any) => {
    const isWorse = snapshot && parseFloat(val) > parseFloat(snapshot);
    const isBetter = snapshot && parseFloat(val) < parseFloat(snapshot);

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#555]">
                    {icon}
                    <span className="text-[10px] font-bold uppercase">{label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-mono font-bold text-[#e5e5e5]">{val}</span>
                    <span className="text-[9px] text-[#555]">{unit}</span>
                </div>
            </div>
            {p99 && (
                <div className="flex justify-between items-center text-[9px] text-[#444]">
                    <span>P99: {p99}{unit}</span>
                    {snapshot && (
                        <span className={isBetter ? 'text-green-500' : isWorse ? 'text-red-500' : ''}>
                            vs {snapshot}{unit}
                        </span>
                    )}
                </div>
            )}
            {max && (
                <div className="w-full h-1 bg-[#111] rounded-full overflow-hidden mt-1">
                    <div 
                        className="h-full bg-orange-500 transition-all duration-300" 
                        style={{ width: `${(parseFloat(val) / max) * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
}
