import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { RateLimitBar } from "@/components/RateLimitBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
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
import AIConfigAdmin from "./pages/AIConfigAdmin";
import Downloads from "./pages/Downloads";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Community from "./pages/Community";
import ChatBuddy from "./pages/ChatBuddy";
import { useTimeTracker } from "@/hooks/useAchievements";
import { useVisitHeartbeat } from "@/hooks/useVisitHeartbeat";

const queryClient = new QueryClient();

const AppContent = () => {
  useTimeTracker();
  useVisitHeartbeat();

  return (
    <>
      <Toaster />
      <Sonner />
      <RateLimitBar />
      
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
          <Route path="/ai-config" element={<AIConfigAdmin />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/community" element={<Community />} />
          <Route path="/chat-buddy" element={<ChatBuddy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
