import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/hooks/useOrganization";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Portfolio from "@/pages/Portfolio";
import Dashboard from "@/pages/Dashboard";
import ProjectView from "@/pages/ProjectView";
import AdminUsers from "@/pages/AdminUsers";
import Profile from "@/pages/Profile";
import Guide from "@/pages/Guide";
import AuditPage from "@/pages/AuditPage";
import OrganizationSettings from "@/pages/OrganizationSettings";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrganizationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
                  <Route path="/audit" element={<AuditPage />} />
                  <Route path="/organization" element={<OrganizationSettings />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </OrganizationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
