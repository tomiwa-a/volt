'use client';

import { useRouter, useParams } from 'next/navigation';
import EditorHeader from '@/components/EditorHeader';
import Sidebar from '@/components/Sidebar';
import Canvas from '@/components/Canvas';
import Timeline from '@/components/Timeline';
import { useState } from 'react';

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [activeTab, setActiveTab] = useState('layers');

  const projectName = 'Summer Vlog 2026'; // TODO: Fetch from IndexedDB

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-gray-50 text-gray-900">
      <EditorHeader
        projectName={projectName}
        onBack={() => router.push('/')}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} />

        {/* Main Editor Workspace */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Canvas projectName={projectName} />
          <Timeline projectName={projectName} />
        </div>

        {/* Right Panel (Sidebar Content) - TODO */}
        <div className="w-64 border-l border-gray-200 bg-white p-4 overflow-y-auto hidden">
          <div className="text-xs text-gray-500">
            {activeTab === 'layers' && <p>Layers panel</p>}
            {activeTab === 'uploads' && <p>Uploads panel</p>}
            {activeTab === 'captions' && <p>Captions panel</p>}
            {activeTab === 'magic' && <p>Magic panel</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
