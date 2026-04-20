import { Video, Layers, Upload, Type, Sparkles, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
}

export default function Sidebar({ activeTab = 'layers' }: SidebarProps) {
  const tabs = [
    { id: 'layers', icon: Layers, label: 'Layers', tooltip: 'Manage tracks' },
    { id: 'uploads', icon: Upload, label: 'Uploads', tooltip: 'File library' },
    { id: 'captions', icon: Type, label: 'Captions', tooltip: 'Transcriptions' },
    { id: 'magic', icon: Sparkles, label: 'Magic', tooltip: 'AI tools' },
  ];

  return (
    <nav className="flex w-16 flex-col items-center border-r border-zinc-800 bg-zinc-900/50 py-4 gap-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`relative p-3 rounded-lg transition-all group ${
              isActive
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title={tab.tooltip}
          >
            <Icon size={20} />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 rounded bg-zinc-800 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-40">
              {tab.label}
            </div>
          </button>
        );
      })}

      {/* Settings */}
      <div className="mt-auto">
        <button className="relative p-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all group">
          <Settings size={20} />
          <div className="absolute left-full ml-2 px-2 py-1 rounded bg-zinc-800 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-40">
            Settings
          </div>
        </button>
      </div>
    </nav>
  );
}
