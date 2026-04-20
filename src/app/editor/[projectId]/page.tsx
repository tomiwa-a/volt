'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import EditorHeader from '@/components/EditorHeader';
import Sidebar from '@/components/Sidebar';
import SecondarySidebar from '@/components/SecondarySidebar';
import Canvas from '@/components/Canvas';
import Timeline from '@/components/Timeline';
import ExportModal from '@/components/ExportModal';
import { useProjectStore } from '@/store/useProjectStore';
import { useEditorStore } from '@/store/useEditorStore';

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  
  const { name: projectName, loadProject } = useProjectStore();
  const { isSidebarOpen } = useEditorStore();

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId).finally(() => setIsLoading(false));
    }
  }, [projectId, loadProject]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Waking up the engine...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-gray-50 text-gray-900">
      <EditorHeader
        projectName={projectName}
        onBack={() => router.push('/')}
        onExport={() => setIsExportOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />

        <SecondarySidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Canvas projectName={projectName} />
          <Timeline projectName={projectName} />
        </div>
      </div>

      <ExportModal
        projectName={projectName}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </main>
  );
}
