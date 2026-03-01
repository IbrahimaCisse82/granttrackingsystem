import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import AppLayout from '@/components/layout/AppLayout';
import Portfolio from '@/pages/Portfolio';
import ProjectView from '@/pages/ProjectView';
import AdminUsers from '@/pages/AdminUsers';
import Auth from '@/pages/Auth';

export default function Index() {
  const { user, loading } = useAuth();
  const { currentPage } = useAppStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <AppLayout>
      {currentPage === 'portfolio' && <Portfolio />}
      {currentPage === 'project' && <ProjectView />}
      {currentPage === 'tutoriel' && (
        <div className="text-center py-20 text-muted-foreground">
          <h1 className="text-xl font-bold text-foreground mb-2">Guide d'utilisation</h1>
          <p className="text-sm">Section en cours de développement.</p>
        </div>
      )}
      {currentPage === 'admin' && <AdminUsers />}
    </AppLayout>
  );
}
