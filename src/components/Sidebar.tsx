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
    <nav className="flex w-[72px] flex-col items-center border-r border-gray-200 bg-white py-6 gap-3 z-10">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`relative p-3 rounded-md group flex flex-col items-center gap-1 ${
              isActive
                ? 'bg-red-50 text-red-700 border border-red-100'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
            }`}
            title={tab.tooltip}
          >
            <Icon size={22} className={isActive ? "stroke-[2.5]" : "stroke-2"} />
            <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2 py-1 rounded bg-gray-900 text-xs font-medium text-white whitespace-nowrap hidden group-hover:block pointer-events-none z-50">
              {tab.tooltip}
            </div>
          </button>
        );
      })}

      {/* Settings */}
      <div className="mt-auto">
        <button className="relative p-3 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-50 group border border-transparent flex flex-col items-center gap-1">
          <Settings size={22} className="stroke-2" />
          <span className="text-[10px] font-medium tracking-wide">Settings</span>
          <div className="absolute left-full ml-3 px-2 py-1 rounded bg-gray-900 text-xs font-medium text-white whitespace-nowrap hidden group-hover:block pointer-events-none z-50">
            Preferences
          </div>
        </button>
      </div>
    </nav>
  );
}
