import { ChevronLeft, Download, Film, MoreVertical } from 'lucide-react';

interface EditorHeaderProps {
  projectName: string;
  onBack?: () => void;
  onExport?: () => void;
}

export default function EditorHeader({ projectName, onBack, onExport }: EditorHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 z-10 flex-shrink-0">
      {/* Left: Back Button & Project Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          title="Back to projects"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-gray-100 text-red-700">
             <Film size={14} />
          </div>
          <h1 className="font-semibold text-sm text-gray-900 truncate pl-1 cursor-pointer hover:text-red-700 transition-colors" title="Click to rename">
            {projectName}
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
          title="Export video"
        >
          <Download size={13} />
          Export
        </button>
        <button
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="More options"
        >
          <MoreVertical size={16} />
        </button>
      </div>
    </header>
  );
}
