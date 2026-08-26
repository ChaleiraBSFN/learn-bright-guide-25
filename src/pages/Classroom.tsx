import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Plus, Trash2, Copy, Loader2, GraduationCap, Users,
  MonitorPlay, MessageSquare, ClipboardList, Send, ChevronLeft, ChevronRight, Square,
} from 'lucide-react';
import { useTeacherClassrooms, useClassroomRoom, normalizeKey, type Classroom } from '@/hooks/useClassroom';
import { ClassroomMaterialView } from '@/components/classroom/ClassroomMaterialView';

export default function ClassroomPage() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { classrooms, loading, createClassroom, deleteClassroom, toggleOpen, reload } = useTeacherClassrooms();
  const [selected, setSelected] = useState<Classroom | null>(null);
  const room = useClassroomRoom(selected?.id ?? null);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [key, setKey] = useState('');
  const [creating, setCreating] = useState(false);

  const [tema, setTema] = useState('');
  const [materialType, setMaterialType] = useState<'study' | 'exercises'>('study');
  const [generating, setGenerating] = useState(false);
  const [openMaterialId, setOpenMaterialId] = useState<string | null>(null);

  const [chatText, setChatText] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (selected) {
      const fresh = classrooms.find((c) => c.id === selected.id);
      if (fresh && fresh !== selected) setSelected(fresh);
    }
  }, [classrooms, selected]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [room.messages.length]);

  const inviteLink = useMemo(
    () => (selected ? `${window.location.origin}/sala/${selected.join_key}` : ''),
    [selected],
  );

  const handleCreate = async () => {
    setCreating(true);
    const res = await createClassroom(name, subject, key);
    setCreating(false);
    if ('error' in res) {
      const msg =
        res.error === 'key_taken'
          ? t('classroom.keyTaken', 'Essa chave já está em uso. Escolha outra.')
          : res.error === 'invalid_key'
            ? t('classroom.invalidKey', 'A chave precisa ter pelo menos 4 caracteres.')
            : t('classroom.createError', 'Não foi possível criar a sala.');
      toast({ title: msg, variant: 'destructive' });
      return;
    }
    setName(''); setSubject(''); setKey('');
    toast({ title: t('classroom.created', 'Sala criada!') });
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t('classroom.copied', 'Copiado!') });
  };

  const generateMaterial = async () => {
    if (!selected || !tema.trim()) return;
    setGenerating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionData.session?.access_token) headers.Authorization = `Bearer ${sessionData.session.access_token}`;

      const endpoint = materialType === 'study' ? 'generate-study-content' : 'generate-exercises';
      const body =
        materialType === 'study'
          ? { tema: tema.trim(), nivel: 'medio', idioma: i18n.language, rapido: true }
          : { tema: tema.trim(), nivel: 'medio', quantidade: 5, dificuldade: 'media', idioma: i18n.language, rapido: true };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });


      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || t('classroom.generateError', 'Erro ao gerar o material.'));
      }
      const content = await response.json();

      const { error } = await supabase.from('classroom_materials').insert({
        classroom_id: selected.id,
        type: materialType,
        title: tema.trim(),
        content,
      });
      if (error) throw new Error(error.message);

      setTema('');
      await room.reload();
      toast({ title: t('classroom.published', 'Material publicado na sala!') });
    } catch (e: any) {
      toast({ title: e.message || t('classroom.generateError', 'Erro ao gerar o material.'), variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const setLiveState = async (patch: { material_id?: string | null; section_index?: number; is_live?: boolean }) => {
    if (!selected) return;
    const next = {
      classroom_id: selected.id,
      material_id: patch.material_id !== undefined ? patch.material_id : room.live?.material_id ?? null,
      section_index: patch.section_index !== undefined ? patch.section_index : room.live?.section_index ?? 0,
      is_live: patch.is_live !== undefined ? patch.is_live : room.live?.is_live ?? false,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('classroom_live_state').upsert(next, { onConflict: 'classroom_id' });
    room.setLive(next as any);
  };

  const sendChat = async () => {
    if (!selected || !user || !chatText.trim()) return;
    const text = chatText.trim();
    setChatText('');
    await supabase.from('classroom_messages').insert({
      classroom_id: selected.id,
      teacher_id: user.id,
      author_name: t('classroom.teacher', 'Professor(a)'),
      message: text,
    });
    room.reload();
  };

  const removeStudent = async (id: string) => {
    await supabase.from('classroom_students').delete().eq('id', id);
    room.reload();
  };

  const deleteMaterial = async (id: string) => {
    await supabase.from('classroom_materials').delete().eq('id', id);
    room.reload();
  };

  const [answersByMaterial, setAnswersByMaterial] = useState<any[]>([]);
  useEffect(() => {
    if (!selected) return;
    supabase
      .from('classroom_answers')
      .select('*')
      .eq('classroom_id', selected.id)
      .then(({ data }) => setAnswersByMaterial(data || []));
  }, [selected, room.materials.length]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t('classroom.seoTitle', 'Salas de Aula | Learn Buddy')}
        description={t('classroom.seoDesc', 'Crie salas de aula online, apresente conteúdos e exercícios para seus alunos.')}
        path="/classroom"
        noindex
      />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => (selected ? setSelected(null) : navigate('/'))} aria-label={t('common.back', 'Voltar')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <GraduationCap className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            {selected ? selected.name : t('classroom.title', 'Salas de Aula')}
          </h1>
        </div>

        {!selected ? (
          <div className="space-y-6">
            <div className="liquid-glass rounded-2xl p-4 space-y-3">
              <h2 className="font-semibold text-foreground">{t('classroom.createTitle', 'Criar nova sala')}</h2>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('classroom.namePlaceholder', 'Nome da turma (ex.: 7º ano B)')} />
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('classroom.subjectPlaceholder', 'Matéria (opcional)')} />
              <Input value={key} onChange={(e) => setKey(normalizeKey(e.target.value))} placeholder={t('classroom.keyPlaceholder', 'Chave de acesso (ex.: BIO7A)')} />
              <Button onClick={handleCreate} disabled={creating || !name.trim() || key.length < 4} className="w-full gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t('classroom.create', 'Criar sala')}
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : classrooms.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('classroom.empty', 'Você ainda não tem salas de aula.')}</p>
            ) : (
              <div className="space-y-3">
                {classrooms.map((c) => (
                  <div key={c.id} className="liquid-glass rounded-2xl p-4 flex items-center gap-3">
                    <button className="flex-1 text-left" onClick={() => setSelected(c)}>
                      <p className="font-semibold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.subject ? `${c.subject} · ` : ''}{t('classroom.key', 'Chave')}: {c.join_key}
                      </p>
                    </button>
                    <Badge variant={c.is_open ? 'default' : 'secondary'} className="text-xs">
                      {c.is_open ? t('classroom.open', 'Aberta') : t('classroom.closed', 'Fechada')}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => deleteClassroom(c.id)} aria-label={t('classroom.delete', 'Apagar sala')}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="liquid-glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-sm">
                  <p className="text-muted-foreground">{t('classroom.key', 'Chave')}: <span className="font-mono font-semibold text-foreground">{selected.join_key}</span></p>
                  <p className="text-xs text-muted-foreground break-all">{inviteLink}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => copy(inviteLink)}>
                    <Copy className="h-3 w-3" /> {t('classroom.copyLink', 'Copiar link')}
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t('classroom.entryOpen', 'Entrada aberta')}</span>
                    <Switch checked={selected.is_open} onCheckedChange={(v) => toggleOpen(selected.id, v)} />
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="materials">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="materials" className="gap-1"><ClipboardList className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t('classroom.tabMaterials', 'Materiais')}</span></TabsTrigger>
                <TabsTrigger value="live" className="gap-1"><MonitorPlay className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t('classroom.tabLive', 'Ao vivo')}</span></TabsTrigger>
                <TabsTrigger value="students" className="gap-1"><Users className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t('classroom.tabStudents', 'Alunos')}</span></TabsTrigger>
                <TabsTrigger value="chat" className="gap-1"><MessageSquare className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t('classroom.tabChat', 'Chat')}</span></TabsTrigger>
              </TabsList>

              {/* MATERIALS */}
              <TabsContent value="materials" className="space-y-4 mt-4">
                <div className="liquid-glass rounded-2xl p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">{t('classroom.newMaterial', 'Gerar material para a turma')}</h3>
                  <p className="text-xs text-muted-foreground">{t('classroom.creditsNote', 'A geração usa os seus créditos. Os alunos apenas visualizam e respondem.')}</p>
                  <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder={t('classroom.temaPlaceholder', 'Tema da aula')} />
                  <Select value={materialType} onValueChange={(v) => setMaterialType(v as 'study' | 'exercises')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="study">{t('classroom.typeStudy', 'Conteúdo de estudo')}</SelectItem>
                      <SelectItem value="exercises">{t('classroom.typeExercises', 'Exercícios')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={generateMaterial} disabled={generating || !tema.trim()} className="w-full gap-2">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {t('classroom.generate', 'Gerar e publicar')}
                  </Button>
                </div>

                {room.materials.map((m) => (
                  <div key={m.id} className="liquid-glass rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {m.type === 'study' ? t('classroom.typeStudy', 'Conteúdo de estudo') : t('classroom.typeExercises', 'Exercícios')}
                      </Badge>
                      <p className="font-semibold text-foreground flex-1">{m.title}</p>
                      <Button variant="outline" size="sm" onClick={() => setLiveState({ material_id: m.id, is_live: true, section_index: 0 })}>
                        {t('classroom.present', 'Apresentar')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setOpenMaterialId(openMaterialId === m.id ? null : m.id)}>
                        {openMaterialId === m.id ? t('classroom.hide', 'Ocultar') : t('classroom.view', 'Ver')}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMaterial(m.id)} aria-label={t('classroom.delete', 'Apagar')}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {openMaterialId === m.id && <ClassroomMaterialView material={m} />}

                    {m.type === 'exercises' && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        {answersByMaterial.filter((a) => a.material_id === m.id).length === 0 ? (
                          <p>{t('classroom.noAnswers', 'Nenhuma resposta enviada ainda.')}</p>
                        ) : (
                          answersByMaterial
                            .filter((a) => a.material_id === m.id)
                            .map((a) => {
                              const st = room.students.find((s) => s.id === a.student_id);
                              return (
                                <p key={a.id}>
                                  <span className="text-foreground font-medium">{st?.display_name || t('classroom.student', 'Aluno')}</span>: {a.score ?? 0}%
                                </p>
                              );
                            })
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* LIVE */}
              <TabsContent value="live" className="space-y-4 mt-4">
                <div className="liquid-glass rounded-2xl p-4 space-y-2">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <MonitorPlay className="h-4 w-4 text-primary" />
                    {t('classroom.liveHowTitle', 'Como funciona o Ao vivo')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('classroom.liveHowDesc', 'Escolha um material abaixo e clique em Apresentar. A tela dos alunos passa a mostrar exatamente a parte que você está exibindo. Use Anterior/Próxima para avançar a aula e Encerrar quando terminar.')}
                  </p>
                </div>

                <div className="liquid-glass rounded-2xl p-4 space-y-3">
                  {room.live?.is_live && room.live.material_id ? (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                          {t('classroom.liveNow', 'AO VIVO')}
                        </span>
                        <p className="text-sm text-foreground">
                          {room.materials.find((m) => m.id === room.live?.material_id)?.title}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('classroom.liveWatching', 'Os alunos estão vendo a parte {{n}} deste material.', { n: (room.live?.section_index ?? 0) + 1 })}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setLiveState({ section_index: Math.max(0, (room.live?.section_index ?? 0) - 1) })}>
                          <ChevronLeft className="h-4 w-4" /> {t('classroom.prev', 'Anterior')}
                        </Button>
                        <Badge variant="secondary">{t('classroom.part', 'Parte')} {(room.live?.section_index ?? 0) + 1}</Badge>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setLiveState({ section_index: (room.live?.section_index ?? 0) + 1 })}>
                          {t('classroom.next', 'Próxima')} <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" className="gap-1 ml-auto" onClick={() => setLiveState({ is_live: false })}>
                          <Square className="h-3 w-3" /> {t('classroom.stopLive', 'Encerrar')}
                        </Button>
                      </div>
                    </>
                  ) : room.materials.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('classroom.liveNoMaterials', 'Gere um material na aba Materiais para poder apresentar ao vivo.')}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">{t('classroom.livePick', 'Escolha o que apresentar agora:')}</p>
                      <div className="space-y-2">
                        {room.materials.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 rounded-xl border border-border p-2">
                            <Badge variant="outline" className="text-[10px]">
                              {m.type === 'study' ? t('classroom.typeStudy', 'Conteúdo de estudo') : t('classroom.typeExercises', 'Exercícios')}
                            </Badge>
                            <p className="flex-1 text-sm text-foreground truncate">{m.title}</p>
                            <Button size="sm" className="gap-1" onClick={() => setLiveState({ material_id: m.id, is_live: true, section_index: 0 })}>
                              <MonitorPlay className="h-3.5 w-3.5" /> {t('classroom.present', 'Apresentar')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <StudentsPanel room={room} onRemove={removeStudent} />
              </TabsContent>

              {/* STUDENTS */}
              <TabsContent value="students" className="space-y-2 mt-4">
                <StudentsPanel room={room} onRemove={removeStudent} />
              </TabsContent>


              {/* CHAT */}
              <TabsContent value="chat" className="mt-4">
                <div className="liquid-glass rounded-2xl flex flex-col h-[60vh]">
                  <ScrollArea className="flex-1 p-4" ref={chatRef as any}>
                    <div className="space-y-3">
                      {room.messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.teacher_id ? 'items-end' : 'items-start'}`}>
                          <span className="text-xs text-muted-foreground mb-1">{msg.author_name}</span>
                          <div className={`p-3 rounded-2xl max-w-[80%] ${msg.teacher_id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-3 border-t border-border flex gap-2">
                    <Textarea
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder={t('classroom.messagePlaceholder', 'Escreva uma mensagem')}
                      className="min-h-[40px] max-h-[100px] resize-none"
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                    />
                    <Button onClick={sendChat} disabled={!chatText.trim()} size="icon" aria-label={t('classroom.send', 'Enviar')}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
