'use client';

import { useState } from 'react';
import { useAppStore, Theme, ExportFormat, Resolution, FrameRate } from '@/store/useAppStore';
import {
  SlidersHorizontal,
  Database,
  Cpu,
  Mic,
  ChevronLeft,
  HardDrive,
  Trash2,
  Download,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'general' | 'storage' | 'engine' | 'ai';

const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: SlidersHorizontal },
  { id: 'storage', label: 'Storage', icon: Database },
  { id: 'engine', label: 'Engine', icon: Cpu },
  { id: 'ai', label: 'Transcription', icon: Mic },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const Content = PANELS[activeTab];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="h-14 border-b border-gray-200 bg-white px-6 flex items-center gap-4 sticky top-0 z-30">
        <Link
          href="/"
          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={18} />
        </Link>
        <span className="text-sm font-bold text-gray-900">Settings</span>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-12 flex gap-16">
        {/* Left nav */}
        <aside className="w-48 flex-shrink-0 space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <section className="flex-1 max-w-xl">
          <Content />
        </section>
      </div>
    </main>
  );
}

/* ─── General ──────────────────────────────────────────────────── */
function GeneralSettings() {
  const { 
    theme, setTheme, 
    exportFormat, setExportFormat, 
    resolution, setResolution, 
    frameRate, setFrameRate 
  } = useAppStore();

  return (
    <div className="space-y-8">
      <SectionHeader title="General" subtitle="Interface and project defaults" />

      <SettingsGroup label="Appearance">
        <SettingsRow label="Theme" note="Applies across the entire application">
          <SegmentedControl
            options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]}
            value={theme}
            onChange={(v) => setTheme(v as Theme)}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup label="Export Defaults">
        <SettingsRow label="Format" note="Used when opening the export dialog">
          <SegmentedControl
            options={[{ value: 'mp4', label: 'MP4' }, { value: 'webm', label: 'WebM' }]}
            value={exportFormat}
            onChange={(v) => setExportFormat(v as ExportFormat)}
          />
        </SettingsRow>
        <SettingsRow label="Resolution" note="Default render resolution">
          <SegmentedControl
            options={[{ value: '720p', label: '720p' }, { value: '1080p', label: '1080p' }, { value: '4k', label: '4K' }]}
            value={resolution}
            onChange={(v) => setResolution(v as Resolution)}
          />
        </SettingsRow>
        <SettingsRow label="Frame Rate" note="Frames per second for new projects">
          <SegmentedControl
            options={[{ value: '24', label: '24' }, { value: '30', label: '30' }, { value: '60', label: '60' }]}
            value={frameRate}
            onChange={(v) => setFrameRate(v as FrameRate)}
          />
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}

/* ─── Storage ───────────────────────────────────────────────────── */
function StorageSettings() {
  const used = 12.4;
  const total = 50;
  const pct = (used / total) * 100;

  return (
    <div className="space-y-8">
      <SectionHeader title="Storage" subtitle="Local IndexedDB — your data never leaves this browser" />

      <SettingsGroup label="Usage">
        <div className="py-4 space-y-4">
          <div className="flex justify-between text-xs font-medium text-gray-500">
            <span>{used} GB used</span>
            <span>{total} GB available</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <SettingsRow label="Project metadata" note="EDLs, transcription, settings">
          <span className="text-xs font-mono text-gray-500">1.2 GB</span>
        </SettingsRow>
        <SettingsRow label="Cached model data" note="Whisper weights, indexes">
          <span className="text-xs font-mono text-gray-500">11.2 GB</span>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup label="Privacy">
        <div className="py-4 flex items-start gap-3">
          <ShieldCheck size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            Volt operates entirely offline. No media, metadata, or model data is uploaded to any server. Storage is managed by your browser's IndexedDB.
          </p>
        </div>

        <div className="pt-2">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors w-full justify-center">
            <Trash2 size={14} />
            Clear all local data
          </button>
          <p className="mt-2 text-center text-[10px] text-gray-400">
            This will permanently remove all projects, assets, and cached models.
          </p>
        </div>
      </SettingsGroup>
    </div>
  );
}

/* ─── Engine ────────────────────────────────────────────────────── */
function EngineSettings() {
  const [hwAccel, setHwAccel] = useState(true);
  const [workerThreads, setWorkerThreads] = useState('4');

  return (
    <div className="space-y-8">
      <SectionHeader title="Processing Engine" subtitle="Go WASM sidecar running in a background Worker" />

      <SettingsGroup label="Status">
        <SettingsRow label="Engine binary" note="engine.wasm loaded from /public">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-green-700">Active</span>
          </div>
        </SettingsRow>
        <SettingsRow label="Version" note="">
          <span className="text-xs font-mono text-gray-500">v1.0.4</span>
        </SettingsRow>
        <SettingsRow label="SharedArrayBuffer" note="Required for zero-copy frame passing">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-500" />
            <span className="text-xs text-gray-500">Enabled</span>
          </div>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup label="Performance">
        <SettingsRow label="Hardware acceleration" note="WebCodecs + GPU compositing via canvas">
          <Toggle value={hwAccel} onChange={setHwAccel} />
        </SettingsRow>
        <SettingsRow label="Worker threads" note="Parallel decode threads for the WASM engine">
          <select
            value={workerThreads}
            onChange={e => setWorkerThreads(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-lg outline-none focus:border-gray-900 transition-all"
          >
            <option value="1">1 thread</option>
            <option value="2">2 threads</option>
            <option value="4">4 threads</option>
            <option value="8">8 threads</option>
          </select>
        </SettingsRow>
      </SettingsGroup>

      <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
        <Zap size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700/80 leading-relaxed">
          The engine runs in a dedicated Web Worker thread. The COOP/COEP security headers configured in <code className="font-mono bg-blue-100 px-1 rounded">next.config.mjs</code> are required for SharedArrayBuffer access and cannot be disabled.
        </p>
      </div>
    </div>
  );
}

/* ─── AI / Transcription ────────────────────────────────────────── */
const MODELS = [
  {
    id: 'base',
    name: 'Whisper Base',
    desc: 'Balanced speed and accuracy',
    size: '142 MB',
    installed: true,
  },
  {
    id: 'tiny',
    name: 'Whisper Tiny',
    desc: 'Fastest, best for real-time',
    size: '75 MB',
    installed: false,
  },
  {
    id: 'small',
    name: 'Whisper Small',
    desc: 'Higher accuracy, slower processing',
    size: '484 MB',
    installed: false,
  },
];

function AISettings() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleDownload = (id: string) => {
    setDownloading(id);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setDownloading(null);
          return 0;
        }
        return p + 5;
      });
    }, 80);
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Transcription" subtitle="On-device Whisper models — nothing sent to the cloud" />

      <SettingsGroup label="Installed models">
        <ul className="divide-y divide-gray-100">
          {MODELS.map(m => (
            <li key={m.id} className="py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{m.desc} · {m.size}</p>
                {downloading === m.id && (
                  <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded-full transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                {m.installed ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-green-700">
                    <CheckCircle2 size={13} /> Installed
                  </span>
                ) : downloading === m.id ? (
                  <span className="text-[11px] font-semibold text-gray-500">{progress}%</span>
                ) : (
                  <button
                    onClick={() => handleDownload(m.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-[11px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download size={12} /> Install
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </SettingsGroup>

      <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
        <AlertCircle size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Models are cached in your browser's IndexedDB storage. Removing a model will free up that space but it can be reinstalled at any time.
        </p>
      </div>
    </div>
  );
}

/* ─── Shared primitives ─────────────────────────────────────────── */
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pb-4 border-b border-gray-100">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  );
}

function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, note, children }: { label: string; note: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {note && <p className="text-[11px] text-gray-400 mt-0.5">{note}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex border border-gray-200 rounded-lg overflow-hidden">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
            value === opt.value
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        value ? 'bg-gray-900' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

const PANELS: Record<Tab, React.FC> = {
  general: GeneralSettings,
  storage: StorageSettings,
  engine: EngineSettings,
  ai: AISettings,
};
