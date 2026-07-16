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
const listeners = new Map<string, Set<(flag: SectionFlag) => void>>();

let realtimeSetup = false;
function setupRealtime() {
  if (realtimeSetup) return;
  realtimeSetup = true;
  supabase
    .channel('section_flags_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'section_flags' },
      (payload) => {
        const row = (payload.new || payload.old) as SectionFlag | undefined;
        if (!row?.section_key) return;
        cache.set(row.section_key, row);
        listeners.get(row.section_key)?.forEach((cb) => cb(row));
      },
    )
    .subscribe();
}

async function loadFlag(key: string): Promise<SectionFlag> {
  const { data } = await supabase
    .from('section_flags')
    .select('section_key,enabled,title,message,cta_label,cta_url')
    .eq('section_key', key)
    .maybeSingle();
  const flag: SectionFlag = data ?? {
    section_key: key,
    enabled: true,
    title: 'Em desenvolvimento',
    message: '',
    cta_label: null,
    cta_url: null,
  };
  cache.set(key, flag);
  return flag;
}

export function useSectionFlag(sectionKey: string) {
  const [flag, setFlag] = useState<SectionFlag | null>(
    cache.get(sectionKey) ?? null,
  );
  const [loading, setLoading] = useState(!cache.has(sectionKey));

  useEffect(() => {
    setupRealtime();
    let mounted = true;

    if (!cache.has(sectionKey)) {
      loadFlag(sectionKey).then((f) => {
        if (mounted) {
          setFlag(f);
          setLoading(false);
        }
      });
    } else {
      setFlag(cache.get(sectionKey)!);
      setLoading(false);
    }

    const cb = (f: SectionFlag) => {
      if (mounted) setFlag(f);
    };
    if (!listeners.has(sectionKey)) listeners.set(sectionKey, new Set());
    listeners.get(sectionKey)!.add(cb);

    return () => {
      mounted = false;
      listeners.get(sectionKey)?.delete(cb);
    };
  }, [sectionKey]);

  return { flag, loading };
}
