import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Classroom {
  id: string;
  teacher_id: string;
  name: string;
  subject: string | null;
  join_key: string;
  is_open: boolean;
  created_at: string;
}

export interface ClassroomMaterial {
  id: string;
  classroom_id: string;
  type: string;
  title: string;
  content: any;
  created_at: string;
}

export interface ClassroomStudent {
  id: string;
  classroom_id: string;
  display_name: string;
  last_seen_at: string;
  joined_at: string;
}

export interface ClassroomMessage {
  id: string;
  classroom_id: string;
  student_id: string | null;
  teacher_id: string | null;
  author_name: string;
  message: string;
  created_at: string;
}

export interface ClassroomLiveState {
  classroom_id: string;
  material_id: string | null;
  section_index: number;
  is_live: boolean;
}

export const normalizeKey = (key: string) =>
  key.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '').slice(0, 24);

/** Teacher-side classroom management. */
export function useTeacherClassrooms() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setClassrooms([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('classrooms')
      .select('*')
      .order('created_at', { ascending: false });
    setClassrooms((data as Classroom[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const createClassroom = useCallback(
    async (name: string, subject: string, joinKey: string) => {
      if (!user) return { error: 'unauthenticated' as const };
      const key = normalizeKey(joinKey);
      if (key.length < 4) return { error: 'invalid_key' as const };
      const { data, error } = await supabase
        .from('classrooms')
        .insert({ teacher_id: user.id, name: name.trim(), subject: subject.trim() || null, join_key: key })
        .select()
        .single();
      if (error) {
        return { error: error.code === '23505' ? ('key_taken' as const) : ('unknown' as const) };
      }
      await supabase.from('classroom_live_state').insert({ classroom_id: data.id });
      await load();
      return { data: data as Classroom };
    },
    [user, load],
  );

  const deleteClassroom = useCallback(
    async (id: string) => {
      await supabase.from('classrooms').delete().eq('id', id);
      await load();
    },
    [load],
  );

  const toggleOpen = useCallback(
    async (id: string, isOpen: boolean) => {
      await supabase.from('classrooms').update({ is_open: isOpen }).eq('id', id);
      await load();
    },
    [load],
  );

  return { classrooms, loading, reload: load, createClassroom, deleteClassroom, toggleOpen };
}

/** Teacher-side live room state (materials, students, chat, live pointer). */
export function useClassroomRoom(classroomId: string | null) {
  const [materials, setMaterials] = useState<ClassroomMaterial[]>([]);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [messages, setMessages] = useState<ClassroomMessage[]>([]);
  const [live, setLive] = useState<ClassroomLiveState | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!classroomId) return;
    setLoading(true);
    const [m, s, c, l] = await Promise.all([
      supabase.from('classroom_materials').select('*').eq('classroom_id', classroomId).order('created_at', { ascending: false }),
      supabase.from('classroom_students').select('*').eq('classroom_id', classroomId).order('joined_at', { ascending: true }),
      supabase.from('classroom_messages').select('*').eq('classroom_id', classroomId).order('created_at', { ascending: true }).limit(200),
      supabase.from('classroom_live_state').select('*').eq('classroom_id', classroomId).maybeSingle(),
    ]);
    setMaterials((m.data as ClassroomMaterial[]) || []);
    setStudents((s.data as ClassroomStudent[]) || []);
    setMessages((c.data as ClassroomMessage[]) || []);
    setLive((l.data as ClassroomLiveState) || null);
    setLoading(false);
  }, [classroomId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!classroomId) return;
    const channel = supabase
      .channel(`classroom-teacher-${classroomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_messages', filter: `classroom_id=eq.${classroomId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_students', filter: `classroom_id=eq.${classroomId}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId, load]);

  return { materials, students, messages, live, loading, reload: load, setLive };
}
