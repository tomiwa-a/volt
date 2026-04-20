import { useState, useRef, useEffect } from 'react';
import { Plus, MoreVertical, Calendar, Film, X, Edit2, Trash2, Video, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { Project } from '@/types/schema';
import { ProjectId } from '@/types/identifiers';
import CreateProjectModal from '@/components/modals/CreateProjectModal';

export default function ProjectDashboard() {
  const router = useRouter();
  const projects = useLiveQuery(() => db.projects.orderBy('lastModified').reverse().toArray()) as Project[] | undefined;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dropdown State
  const [openDropdownId, setOpenDropdownId] = useState<ProjectId | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (id: ProjectId) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await db.projects.delete(id);
      setOpenDropdownId(null);
    }
  };

  const handleProjectSuccess = (id: string) => {
    setIsModalOpen(false);
    router.push(`/editor/${id}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-red-100 relative">
      <header className="border-b border-gray-200 bg-white px-8 py-5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-700">
              <Film size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Project Volt</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/settings"
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              title="Settings"
            >
              <SettingsIcon size={20} />
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-md bg-red-700 hover:bg-red-800 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200"
            >
              <Plus size={18} />
              New Project
            </button>
          </div>
        </div>
      </header>

      <div className="px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="group h-56 rounded-lg border border-dashed border-gray-300 hover:border-red-700 hover:bg-red-50 hover:text-red-700 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-700 transition-all duration-200"
            >
              <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-red-700">
                <Plus size={24} />
                <div className="text-center font-medium">Create New</div>
              </div>
            </button>

            {projects?.map((project) => (
              <div
                key={project.id}
                className="group relative h-56 rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-gray-300 transition-all duration-200 flex flex-col"
              >
                <Link href={`/editor/${project.id}`} className="flex-1 flex flex-col">
                  <div className="relative flex-1 bg-gray-100 border-b border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors duration-200">
                    <Film size={32} className="text-gray-300 group-hover:text-red-600 transition-colors duration-200" />
                    <div className="absolute bottom-2 right-2 bg-gray-900/70 px-2 py-0.5 rounded text-[11px] font-mono font-medium text-white">
                      {project.resolution.label}
                    </div>
                  </div>

                  <div className="p-4 bg-white relative">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate pr-8 group-hover:text-red-700 transition-colors">
                        {project.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={12} className="opacity-70" />
                      {new Date(project.lastModified).toLocaleDateString()}
                    </div>
                  </div>
                </Link>

                <button
                  className="absolute bottom-4 right-3 p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 z-10 transition-colors duration-200"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === project.id ? null : project.id);
                  }}
                >
                  <MoreVertical size={16} />
                </button>

                {openDropdownId === project.id && (
                  <div 
                    ref={dropdownRef}
                    className="absolute right-3 bottom-12 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-20 overflow-hidden animate-in fade-in zoom-in duration-200"
                  >
                    <Link 
                      href={`/editor/${project.id}`}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-700 transition-colors duration-200"
                    >
                      <Edit2 size={14} /> Open Editor
                    </Link>
                    <button 
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 border-t border-gray-100"
                      onClick={() => project.id && handleDelete(project.id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CreateProjectModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleProjectSuccess}
        />
      )}
    </main>
  );
}
