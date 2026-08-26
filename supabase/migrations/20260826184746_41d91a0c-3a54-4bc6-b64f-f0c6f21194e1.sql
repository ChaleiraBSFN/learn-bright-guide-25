-- ============ TABLES ============
CREATE TABLE public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  name text NOT NULL,
  subject text,
  join_key text NOT NULL UNIQUE,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.classroom_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  session_token uuid NOT NULL DEFAULT gen_random_uuid(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (classroom_id, session_token)
);

CREATE TABLE public.classroom_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'study',
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.classroom_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.classroom_students(id) ON DELETE CASCADE,
  teacher_id uuid,
  author_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.classroom_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.classroom_materials(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.classroom_students(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (material_id, student_id)
);

CREATE TABLE public.classroom_live_state (
  classroom_id uuid PRIMARY KEY REFERENCES public.classrooms(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.classroom_materials(id) ON DELETE SET NULL,
  section_index integer NOT NULL DEFAULT 0,
  is_live boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_classroom_students_room ON public.classroom_students(classroom_id);
CREATE INDEX idx_classroom_messages_room ON public.classroom_messages(classroom_id, created_at);
CREATE INDEX idx_classroom_materials_room ON public.classroom_materials(classroom_id, created_at);

-- ============ GRANTS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classrooms TO authenticated;
GRANT ALL ON public.classrooms TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_students TO authenticated;
GRANT ALL ON public.classroom_students TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_materials TO authenticated;
GRANT ALL ON public.classroom_materials TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_messages TO authenticated;
GRANT ALL ON public.classroom_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_answers TO authenticated;
GRANT ALL ON public.classroom_answers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_live_state TO authenticated;
GRANT ALL ON public.classroom_live_state TO service_role;

-- ============ RLS ============
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_live_state ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_classroom_teacher(_classroom_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classrooms c WHERE c.id = _classroom_id AND c.teacher_id = auth.uid());
$$;

CREATE POLICY "teacher manages own classrooms" ON public.classrooms
  FOR ALL TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "teacher manages classroom students" ON public.classroom_students
  FOR ALL TO authenticated USING (public.is_classroom_teacher(classroom_id)) WITH CHECK (public.is_classroom_teacher(classroom_id));

CREATE POLICY "teacher manages classroom materials" ON public.classroom_materials
  FOR ALL TO authenticated USING (public.is_classroom_teacher(classroom_id)) WITH CHECK (public.is_classroom_teacher(classroom_id));

CREATE POLICY "teacher manages classroom messages" ON public.classroom_messages
  FOR ALL TO authenticated USING (public.is_classroom_teacher(classroom_id)) WITH CHECK (public.is_classroom_teacher(classroom_id));

CREATE POLICY "teacher manages classroom answers" ON public.classroom_answers
  FOR ALL TO authenticated USING (public.is_classroom_teacher(classroom_id)) WITH CHECK (public.is_classroom_teacher(classroom_id));

CREATE POLICY "teacher manages classroom live state" ON public.classroom_live_state
  FOR ALL TO authenticated USING (public.is_classroom_teacher(classroom_id)) WITH CHECK (public.is_classroom_teacher(classroom_id));

CREATE TRIGGER classrooms_updated_at BEFORE UPDATE ON public.classrooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ANON STUDENT RPCs ============
CREATE OR REPLACE FUNCTION public.classroom_join(_join_key text, _display_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _room public.classrooms;
  _name text := btrim(coalesce(_display_name, ''));
  _student public.classroom_students;
BEGIN
  IF length(_name) < 2 OR length(_name) > 40 THEN
    RETURN jsonb_build_object('error', 'invalid_name');
  END IF;

  SELECT * INTO _room FROM public.classrooms WHERE upper(join_key) = upper(btrim(_join_key));
  IF _room.id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF NOT _room.is_open THEN
    RETURN jsonb_build_object('error', 'closed');
  END IF;

  INSERT INTO public.classroom_students (classroom_id, display_name)
  VALUES (_room.id, _name)
  RETURNING * INTO _student;

  RETURN jsonb_build_object(
    'classroom_id', _room.id,
    'classroom_name', _room.name,
    'subject', _room.subject,
    'student_id', _student.id,
    'session_token', _student.session_token,
    'display_name', _student.display_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.classroom_student_id(_classroom_id uuid, _session_token uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.classroom_students
  WHERE classroom_id = _classroom_id AND session_token = _session_token;
$$;

CREATE OR REPLACE FUNCTION public.classroom_state(_classroom_id uuid, _session_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _student_id uuid;
  _room public.classrooms;
BEGIN
  _student_id := public.classroom_student_id(_classroom_id, _session_token);
  IF _student_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  UPDATE public.classroom_students SET last_seen_at = now() WHERE id = _student_id;
  SELECT * INTO _room FROM public.classrooms WHERE id = _classroom_id;

  RETURN jsonb_build_object(
    'classroom', jsonb_build_object('id', _room.id, 'name', _room.name, 'subject', _room.subject, 'is_open', _room.is_open),
    'materials', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', m.id, 'type', m.type, 'title', m.title, 'content', m.content, 'created_at', m.created_at) ORDER BY m.created_at DESC)
      FROM public.classroom_materials m WHERE m.classroom_id = _classroom_id
    ), '[]'::jsonb),
    'live', (
      SELECT jsonb_build_object('material_id', l.material_id, 'section_index', l.section_index, 'is_live', l.is_live)
      FROM public.classroom_live_state l WHERE l.classroom_id = _classroom_id
    ),
    'messages', COALESCE((
      SELECT jsonb_agg(x ORDER BY (x->>'created_at')) FROM (
        SELECT jsonb_build_object('id', msg.id, 'author_name', msg.author_name, 'message', msg.message,
                                  'created_at', msg.created_at, 'is_teacher', msg.teacher_id IS NOT NULL,
                                  'mine', msg.student_id = _student_id) AS x
        FROM public.classroom_messages msg WHERE msg.classroom_id = _classroom_id
        ORDER BY msg.created_at DESC LIMIT 100
      ) s
    ), '[]'::jsonb),
    'students', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', st.id, 'display_name', st.display_name) ORDER BY st.display_name)
      FROM public.classroom_students st
      WHERE st.classroom_id = _classroom_id AND st.last_seen_at > now() - interval '5 minutes'
    ), '[]'::jsonb),
    'my_answers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('material_id', a.material_id, 'score', a.score, 'answers', a.answers))
      FROM public.classroom_answers a WHERE a.student_id = _student_id
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.classroom_send_message(_classroom_id uuid, _session_token uuid, _message text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _student public.classroom_students;
  _recent integer;
BEGIN
  SELECT * INTO _student FROM public.classroom_students
  WHERE classroom_id = _classroom_id AND session_token = _session_token;
  IF _student.id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  IF length(btrim(coalesce(_message,''))) = 0 OR length(_message) > 800 THEN
    RETURN jsonb_build_object('error', 'invalid_message');
  END IF;

  SELECT count(*)::int INTO _recent FROM public.classroom_messages
  WHERE student_id = _student.id AND created_at > now() - interval '1 minute';
  IF _recent >= 20 THEN
    RETURN jsonb_build_object('error', 'rate_limited');
  END IF;

  INSERT INTO public.classroom_messages (classroom_id, student_id, author_name, message)
  VALUES (_classroom_id, _student.id, _student.display_name, btrim(_message));

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.classroom_submit_answers(_classroom_id uuid, _session_token uuid, _material_id uuid, _answers jsonb, _score integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _student_id uuid;
BEGIN
  _student_id := public.classroom_student_id(_classroom_id, _session_token);
  IF _student_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.classroom_materials WHERE id = _material_id AND classroom_id = _classroom_id) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  INSERT INTO public.classroom_answers (classroom_id, material_id, student_id, answers, score)
  VALUES (_classroom_id, _material_id, _student_id, COALESCE(_answers, '[]'::jsonb), _score)
  ON CONFLICT (material_id, student_id) DO UPDATE
    SET answers = EXCLUDED.answers, score = EXCLUDED.score, created_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.classroom_leave(_classroom_id uuid, _session_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _student_id uuid;
BEGIN
  _student_id := public.classroom_student_id(_classroom_id, _session_token);
  IF _student_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;
  DELETE FROM public.classroom_students WHERE id = _student_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.classroom_peek(_join_key text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT jsonb_build_object('id', c.id, 'name', c.name, 'subject', c.subject, 'is_open', c.is_open)
    FROM public.classrooms c WHERE upper(c.join_key) = upper(btrim(_join_key))
  ), jsonb_build_object('error', 'not_found'));
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_classroom_students()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.classroom_students WHERE last_seen_at < now() - interval '90 days';
$$;

GRANT EXECUTE ON FUNCTION public.classroom_join(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.classroom_state(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.classroom_send_message(uuid, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.classroom_submit_answers(uuid, uuid, uuid, jsonb, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.classroom_leave(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.classroom_peek(text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.classroom_student_id(uuid, uuid) FROM anon, authenticated;

-- ============ REALTIME ============
ALTER TABLE public.classroom_messages REPLICA IDENTITY FULL;
ALTER TABLE public.classroom_live_state REPLICA IDENTITY FULL;
ALTER TABLE public.classroom_students REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_live_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_students;