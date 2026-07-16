import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SectionFlag = {
  section_key: string;
  enabled: boolean;
  title: string;
  message: string;
  cta_label: string | null;
  cta_url: string | null;
};

const cache = new Map<string, SectionFlag>();
const listeners = new Set<() => void>();
let loaded = false;
let loadingPromise: Promise<void> | null = null;

async function loadAllFlags() {
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const { data } = await supabase
      .from('section_flags')
      .select('section_key,enabled,title,message,cta_label,cta_url');
    (data as SectionFlag[] | null)?.forEach((row) => cache.set(row.section_key, row));
    loaded = true;
    listeners.forEach((cb) => cb());
  })();
  return loadingPromise;
}

let realtimeSetup = false;
function setupRealtime() {
  if (realtimeSetup) return;
  realtimeSetup = true;
  const channelName = `section_flags_rt_${Math.random().toString(36).slice(2, 8)}`;
  const channel = supabase.channel(channelName);
  channel
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'section_flags' },
      (payload) => {
        const row = (payload.new || payload.old) as SectionFlag | undefined;
        if (!row?.section_key) return;
        cache.set(row.section_key, row);
        listeners.forEach((cb) => cb());
      },
    )
    .subscribe();
}

function defaultFlag(key: string): SectionFlag {
  return {
    section_key: key,
    enabled: true,
    title: 'Em desenvolvimento',
    message: '',
    cta_label: null,
    cta_url: null,
  };
}

export function useSectionFlag(sectionKey: string) {
  const [, setTick] = useState(0);
  const [loading, setLoading] = useState(!loaded);

  useEffect(() => {
    setupRealtime();
    const cb = () => {
      setLoading(false);
      setTick((t) => t + 1);
    };
    listeners.add(cb);
    if (!loaded) {
      loadAllFlags().then(cb);
    } else {
      setLoading(false);
    }
    return () => {
      listeners.delete(cb);
    };
  }, []);

  const flag = cache.get(sectionKey) ?? (loaded ? defaultFlag(sectionKey) : null);
  return { flag, loading };
}
