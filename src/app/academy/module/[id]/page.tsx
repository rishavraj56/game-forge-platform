import { MainLayout } from '@/components/layout/main-layout';
import { ModuleContentViewer } from '@/components/academy/module-content-viewer';
import { getModuleById, getUserModuleProgress } from '@/lib/mock-data';
import { notFound } from 'next/navigation';

interface ModulePageProps {
  params: {
    id: string;
  };
}

export default function ModulePage({ params }: ModulePageProps) {
  const module = getModuleById(params.id);
  const userId = '1'; // Mock user ID
  
  if (!module) {
    notFound();
  }

  const userProgress = getUserModuleProgress(userId, params.id);

  return (
    <MainLayout>
      <div className="py-6">
        <ModuleContentViewer
          module={module}
          userProgress={userProgress}
          onProgressUpdate={(contentId, completed) => {
            console.log('Progress update:', contentId, completed);
            // In a real app, this would update the backend
          }}
          onModuleComplete={(moduleId) => {
            console.log('Module completed:', moduleId);
            // In a real app, this would update the backend and show certificate
          }}
        />
      </div>
    </MainLayout>
  );
}