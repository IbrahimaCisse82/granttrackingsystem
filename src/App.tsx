import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/hooks/useOrganization";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

// Lazy-loaded pages for better initial load performance
const Portfolio = lazy(() => import("@/pages/Portfolio"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ProjectView = lazy(() => import("@/pages/ProjectView"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const Profile = lazy(() => import("@/pages/Profile"));
const Guide = lazy(() => import("@/pages/Guide"));
const AuditPage = lazy(() => import("@/pages/AuditPage"));
const OrganizationSettings = lazy(() => import("@/pages/OrganizationSettings"));
const FieldReports = lazy(() => import("@/pages/FieldReports"));
const AdminSchema = lazy(() => import("@/pages/AdminSchema"));
const DonorReports = lazy(() => import("@/pages/DonorReports"));
const Auth = lazy(() => import("@/pages/Auth"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<Portfolio />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/projects/:projectId" element={<ProjectView />} />
                      <Route path="/admin" element={<AdminUsers />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/guide" element={<Guide />} />
                      <Route path="/help" element={<Guide />} />
                      <Route path="/audit" element={<AuditPage />} />
                      <Route path="/organization" element={<OrganizationSettings />} />
                      <Route path="/field-reports" element={<FieldReports />} />
                      <Route path="/admin/schema" element={<AdminSchema />} />
                      <Route path="/donor-reports" element={<DonorReports />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
