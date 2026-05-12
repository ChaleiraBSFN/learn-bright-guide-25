import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "lb_visit_session_id";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Fires a heartbeat every 30s so admins see live "online now" counts. */
export function useVisitHeartbeat() {
  useEffect(() => {
    const sessionId = getSessionId();
    const ping = () => {
      supabase.rpc("track_site_visit", {
        _session_id: sessionId,
        _user_agent: navigator.userAgent,
        _search_query: null,
      }).then(() => {}, () => {});
    };
    ping();
    const interval = setInterval(ping, 30_000);
    const onVisible = () => { if (document.visibilityState === "visible") ping(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", ping);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", ping);
    };
  }, []);
}
