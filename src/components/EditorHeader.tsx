import { ChevronLeft, Download, MoreVertical } from 'lucide-react';

interface EditorHeaderProps {
  projectName: string;
  onBack?: () => void;
}

export default function EditorHeader({ projectName, onBack }: EditorHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
      {/* Left: Back Button & Project Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          title="Back to projects"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-semibold text-sm truncate cursor-pointer hover:text-blue-400 transition-colors" title="Click to rename">
          {projectName}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          title="Export video"
        >
          <Download size={14} />
          Export
        </button>
        <button
          className="p-1 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          title="More options"
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </header>
  );
}
