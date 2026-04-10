import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import OrganizationOnboarding from '@/components/OrganizationOnboarding';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const { needsOnboarding, isLoading: orgLoading } = useOrganization();

  if (loading || (user && orgLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (needsOnboarding) return <OrganizationOnboarding />;

  return <Outlet />;
}
