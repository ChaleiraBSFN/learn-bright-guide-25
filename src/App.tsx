import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import ManageUsers from "./pages/ManageUsers";
import SupportAdmin from "./pages/SupportAdmin";
import Install from "./pages/Install";
import EngineNoticesAdmin from "./pages/EngineNoticesAdmin";

import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import UpdateNoticesAdmin from "./pages/UpdateNoticesAdmin";
import PlatformControl from "./pages/PlatformControl";
import NotFound from "./pages/NotFound";
import { useTimeTracker } from "@/hooks/useAchievements";

const queryClient = new QueryClient();

const AppContent = () => {
  useTimeTracker();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/manage-users" element={<ManageUsers />} />
          <Route path="/support-admin" element={<SupportAdmin />} />
          <Route path="/install" element={<Install />} />
          <Route path="/engine-notices" element={<EngineNoticesAdmin />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-notices" element={<UpdateNoticesAdmin />} />
          <Route path="/platform-control" element={<PlatformControl />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
