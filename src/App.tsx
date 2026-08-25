import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { RateLimitBar } from "@/components/RateLimitBar";
import { CookieConsent } from "@/components/CookieConsent";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { SubscriptionProvider } from "@/hooks/useSubscription";

import Index from "./pages/Index";

import { useTimeTracker } from "@/hooks/useAchievements";
import { useVisitHeartbeat } from "@/hooks/useVisitHeartbeat";

const queryClient = new QueryClient();

const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const SupportAdmin = lazy(() => import("./pages/SupportAdmin"));
const Install = lazy(() => import("./pages/Install"));
const EngineNoticesAdmin = lazy(() => import("./pages/EngineNoticesAdmin"));
const Settings = lazy(() => import("./pages/Settings"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const UpdateNoticesAdmin = lazy(() => import("./pages/UpdateNoticesAdmin"));
const PlatformControl = lazy(() => import("./pages/PlatformControl"));
const AIConfigAdmin = lazy(() => import("./pages/AIConfigAdmin"));
const Downloads = lazy(() => import("./pages/Downloads"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Community = lazy(() => import("./pages/Community"));
const ChatBuddy = lazy(() => import("./pages/ChatBuddy"));
const RewardShop = lazy(() => import("./pages/RewardShop"));
const CarouselBannersAdmin = lazy(() => import("./pages/CarouselBannersAdmin"));
const SectionFlagsAdmin = lazy(() => import("./pages/SectionFlagsAdmin"));
const Buddy = lazy(() => import("./pages/Buddy"));


const AppContent = () => {
  useTimeTracker();
  useVisitHeartbeat();

  // Prefetch the heaviest routes once the browser is idle, so opening them is instant.
  useEffect(() => {
    const prefetch = () => {
      import("./pages/ChatBuddy");
      import("./pages/Community");
      import("./pages/Buddy");
      import("./pages/Settings");
    };
    const idle = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: any) => number);
    if (idle) {
      const id = idle(prefetch, { timeout: 3000 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(prefetch, 2000);
    return () => window.clearTimeout(timer);
  }, []);


  return (
    <>
      <Toaster />
      <Sonner />
      <RateLimitBar />
      
      <BrowserRouter>
        <Suspense fallback={null}>
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
            <Route path="/reward-shop" element={<RewardShop />} />
            <Route path="/carousel-banners" element={<CarouselBannersAdmin />} />
            <Route path="/section-flags" element={<SectionFlagsAdmin />} />
            <Route path="/buddy" element={<Buddy />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <CookieConsent />
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);


export default App;
