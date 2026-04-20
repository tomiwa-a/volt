import { ChevronLeft, Download, Film, MoreVertical } from 'lucide-react';

interface EditorHeaderProps {
  projectName: string;
  onBack?: () => void;
}

export default function EditorHeader({ projectName, onBack }: EditorHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 z-10">
      {/* Left: Back Button & Project Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900"
          title="Back to projects"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="h-4 w-[1px] bg-gray-300 mx-1"></div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-gray-100 text-red-700">
             <Film size={14} />
          </div>
          <h1 className="font-medium text-sm text-gray-900 truncate pl-1 cursor-pointer hover:text-red-700" title="Click to rename">
            {projectName}
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800"
          title="Export video"
        >
          <Download size={14} />
          Export
        </button>
        <button
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900"
          title="More options"
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </header>
  );
}
