import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import AppLayout from '@/components/layout/AppLayout';
import Portfolio from '@/pages/Portfolio';
import ProjectView from '@/pages/ProjectView';
import AdminUsers from '@/pages/AdminUsers';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Guide from '@/pages/Guide';
import AuditPage from '@/pages/AuditPage';
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
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'profile' && <Profile />}
      {currentPage === 'tutoriel' && <Guide />}
      {currentPage === 'admin' && <AdminUsers />}
      {currentPage === 'audit' && <AuditPage />}
    </AppLayout>
  );
}
