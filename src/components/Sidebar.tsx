import { SidebarTab } from '@/types/schema';
import { useEditorStore } from '@/store/useEditorStore';
import { Layers, Upload, Type, Settings } from 'lucide-react';
import Link from 'next/link';

export default function Sidebar() {
  const { activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen } = useEditorStore();

  const handleTabClick = (id: SidebarTab) => {
    if (activeTab === id && isSidebarOpen) {
      setIsSidebarOpen(false);
    } else {
      setActiveTab(id);
      setIsSidebarOpen(true);
    }
  };

  const tabs: { id: SidebarTab; icon: any; label: string; tooltip: string }[] = [
    { id: 'assets', icon: Upload, label: 'Assets', tooltip: 'Media library' },
    { id: 'text', icon: Type, label: 'Text', tooltip: 'Add text & titles' },
    { id: 'captions', icon: Type, label: 'Captions', tooltip: 'Manage subtitles' },
    { id: 'layers', icon: Layers, label: 'Tracks', tooltip: 'Timeline tracks' },
  ];

  return (
    <nav className="flex w-[72px] flex-col items-center border-r border-gray-200 bg-white py-6 gap-3 z-30 flex-shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`relative p-3 rounded-md group flex flex-col items-center gap-1 transition-all duration-200 ${
              isActive
                ? 'bg-red-50 text-red-700 border border-red-100'
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
            }`}
            title={tab.tooltip}
          >
            <Icon size={22} className={isActive ? "stroke-[2.5]" : "stroke-2"} />
            <span className="text-[10px] font-semibold tracking-tight">{tab.label}</span>
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2 py-1 rounded bg-gray-900 text-[11px] font-medium text-white whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 origin-left">
              {tab.tooltip}
            </div>
          </button>
        );
      })}

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col items-center gap-3">
        <Link 
          href="/settings"
          className="relative p-3 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-50 group border border-transparent flex flex-col items-center gap-1 transition-all duration-200"
        >
          <Settings size={22} className="stroke-2" />
          <span className="text-[10px] font-semibold tracking-tight">Settings</span>
          <div className="absolute left-full ml-3 px-2 py-1 rounded bg-gray-900 text-[11px] font-medium text-white whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 origin-left">
            Preferences
          </div>
        </Link>
      </div>
    </nav>
  );
}
