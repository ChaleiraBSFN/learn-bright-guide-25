import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EngineNotice {
  id: string;
  engine_key: string;
  engine_name: string;
  status: 'active' | 'maintenance' | 'inactive';
  notice_message: string | null;
  show_banner: boolean;
  updated_at: string;
}

export function useEngineNotices() {
  return useQuery({
    queryKey: ['engine-notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engine_notices')
        .select('*')
        .order('engine_key');
      if (error) throw error;
      return data as EngineNotice[];
    },
    staleTime: 30_000,
  });
}

export function useUpdateEngineNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status?: string; notice_message?: string | null; show_banner?: boolean }) => {
      const { id, ...updates } = params;
      const { error } = await supabase
        .from('engine_notices')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['engine-notices'] });
      qc.invalidateQueries({ queryKey: ['engine-notices-banners'] });
    },
  });
}

export function useActiveNotices() {
  return useQuery({
    queryKey: ['engine-notices-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engine_notices')
        .select('*')
        .neq('status', 'active');
      if (error) throw error;
      return data as EngineNotice[];
    },
    staleTime: 60_000,
  });
}
