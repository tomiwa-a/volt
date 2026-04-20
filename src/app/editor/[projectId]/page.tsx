'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import EditorHeader from '@/components/EditorHeader';
import Sidebar from '@/components/Sidebar';
import SecondarySidebar from '@/components/SecondarySidebar';
import Canvas from '@/components/Canvas';
import Timeline from '@/components/Timeline';
import ExportModal from '@/components/ExportModal';

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [activeTab, setActiveTab] = useState('assets');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const projectName = 'Summer Vlog 2026'; // TODO: Fetch from IndexedDB

  const handleTabClick = (tabId: string) => {
    if (activeTab === tabId) {
      setIsPanelOpen(!isPanelOpen);
    } else {
      setActiveTab(tabId);
      setIsPanelOpen(true);
    }
  };

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-gray-50 text-gray-900">
      <EditorHeader
        projectName={projectName}
        onBack={() => router.push('/')}
        onExport={() => setIsExportOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          activeTab={activeTab}
          onTabClick={handleTabClick}
        />

        <SecondarySidebar
          activeTab={activeTab}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
        />

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
