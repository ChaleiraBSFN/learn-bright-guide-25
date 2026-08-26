import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Loader2, MonitorPlay, ClipboardList, MessageSquare, Send, ShieldCheck, LogOut } from 'lucide-react';
import { ClassroomMaterialView } from '@/components/classroom/ClassroomMaterialView';
import { getMaterialParts } from '@/lib/classroomParts';

interface Session {
  classroom_id: string;
  classroom_name: string;
  session_token: string;
  display_name: string;
  join_key: string;
}

const storageKey = (key: string) => `lb_classroom_${key.toUpperCase()}`;

export default function ClassroomJoin() {
  const { key: routeKey } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [keyInput, setKeyInput] = useState(routeKey?.toUpperCase() || '');
  const [name, setName] = useState('');
  const [peek, setPeek] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<string>('live');
  const [state, setState] = useState<any>(null);
  const [chatText, setChatText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Restore an existing session for this classroom key
  useEffect(() => {
    if (!routeKey) return;
    const raw = localStorage.getItem(storageKey(routeKey));
    if (raw) {
      try { setSession(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, [routeKey]);

  // Preview classroom info from the key
  useEffect(() => {
    const k = (routeKey || '').trim();
    if (!k) return;
    supabase.rpc('classroom_peek', { _join_key: k }).then(({ data }) => setPeek(data));
  }, [routeKey]);

  const refresh = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.rpc('classroom_state', {
      _classroom_id: session.classroom_id,
      _session_token: session.session_token,
    });
    const result = data as any;
    if (result?.error === 'unauthorized') {
      localStorage.removeItem(storageKey(session.join_key));
      setSession(null);
      return;
    }
    setState(result);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    refresh();
    const interval = setInterval(refresh, 8000);
    const channel = supabase
      .channel(`classroom-student-${session.classroom_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_messages', filter: `classroom_id=eq.${session.classroom_id}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_live_state', filter: `classroom_id=eq.${session.classroom_id}` }, () => refresh())
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [session, refresh]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [state?.messages?.length]);

  const handleJoin = async () => {
    const k = (routeKey || keyInput).trim();
    if (!k || name.trim().length < 2) return;
    setJoining(true);
    const { data, error } = await supabase.rpc('classroom_join', { _join_key: k, _display_name: name.trim() });
    setJoining(false);
    const result = data as any;
    if (error || !result || result.error) {
      const code = result?.error;
      toast({
        title:
          code === 'closed'
            ? t('classroom.roomClosed', 'A entrada nesta sala está fechada.')
            : code === 'invalid_name'
              ? t('classroom.invalidName', 'Digite um nome com 2 a 40 caracteres.')
              : t('classroom.roomNotFound', 'Sala não encontrada. Confira a chave.'),
        variant: 'destructive',
      });
      return;
    }
    const s: Session = {
      classroom_id: result.classroom_id,
      classroom_name: result.classroom_name,
      session_token: result.session_token,
      display_name: result.display_name,
      join_key: k.toUpperCase(),
    };
    localStorage.setItem(storageKey(k), JSON.stringify(s));
    setSession(s);
  };

  const leave = async () => {
    if (!session) return;
    await supabase.rpc('classroom_leave', { _classroom_id: session.classroom_id, _session_token: session.session_token });
    localStorage.removeItem(storageKey(session.join_key));
    setSession(null);
    setState(null);
  };

  const sendChat = async () => {
    if (!session || !chatText.trim()) return;
    const text = chatText.trim();
    setChatText('');
    await supabase.rpc('classroom_send_message', {
      _classroom_id: session.classroom_id,
      _session_token: session.session_token,
      _message: text,
    });
    refresh();
  };

  const submitAnswers = async (materialId: string, answers: any[], score: number) => {
    if (!session) return;
    setSubmitting(true);
    await supabase.rpc('classroom_submit_answers', {
      _classroom_id: session.classroom_id,
      _session_token: session.session_token,
      _material_id: materialId,
      _answers: answers,
      _score: score,
    });
    setSubmitting(false);
    refresh();
  };

  // ---------- JOIN SCREEN ----------
  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <SEO
          title={t('classroom.joinSeoTitle', 'Entrar na sala de aula | Learn Buddy')}
          description={t('classroom.joinSeoDesc', 'Entre na sala de aula do seu professor com a chave de acesso.')}
          path="/sala"
          noindex
        />
        <div className="w-full max-w-md liquid-glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">{t('classroom.joinTitle', 'Entrar na sala de aula')}</h1>
            </div>
            <LanguageSelector />
          </div>

          {peek?.name && (
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-sm font-semibold text-foreground">{peek.name}</p>
              {peek.subject && <p className="text-xs text-muted-foreground">{peek.subject}</p>}
              {!peek.is_open && (
                <Badge variant="secondary" className="mt-2 text-xs">{t('classroom.closed', 'Fechada')}</Badge>
              )}
            </div>
          )}

          {!routeKey && (
            <Input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
              placeholder={t('classroom.keyPlaceholder', 'Chave de acesso (ex.: BIO7A)')}
            />
          )}

          <Input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder={t('classroom.namePrompt', 'Seu nome (use só o primeiro nome)')}
          />

          <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1 text-foreground font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              {t('classroom.privacyTitle', 'Privacidade (LGPD)')}
            </p>
            <p>{t('classroom.privacyText', 'Coletamos apenas o nome que você digitar, para o professor identificar quem está na sala. Não pedimos e-mail, senha nem qualquer outro dado. Use apenas o primeiro nome ou um apelido. Os dados ficam com o professor responsável pela turma e são apagados quando a sala é excluída ou após 90 dias sem uso. Não exibimos anúncios dentro da sala de aula.')}</p>
            <button type="button" onClick={() => navigate('/privacy')} className="underline hover:text-foreground">
              {t('classroom.privacyLink', 'Ler a política de privacidade')}
            </button>
          </div>

          <Button onClick={handleJoin} disabled={joining || name.trim().length < 2 || (!routeKey && keyInput.trim().length < 4)} className="w-full">
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : t('classroom.enter', 'Entrar na sala')}
          </Button>
        </div>
      </div>
    );
  }

  // ---------- ROOM ----------
  const liveMaterial = state?.live?.is_live
    ? (state?.materials || []).find((m: any) => m.id === state.live.material_id)
    : null;
  const myAnswers: any[] = state?.my_answers || [];
  const liveSection: number = state?.live?.section_index ?? 0;
  const liveParts = getMaterialParts(liveMaterial);
  const livePart = liveParts[Math.min(Math.max(liveSection, 0), Math.max(liveParts.length - 1, 0))];

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${session.classroom_name} | Learn Buddy`} description={t('classroom.joinSeoDesc', 'Sala de aula online.')} path="/sala" noindex />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground flex-1">{session.classroom_name}</h1>
          <LanguageSelector />
          <Button variant="ghost" size="sm" className="gap-1" onClick={leave}>
            <LogOut className="h-3.5 w-3.5" /> {t('classroom.leave', 'Sair')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t('classroom.youAre', 'Você está como')}: <strong className="text-foreground">{session.display_name}</strong></p>

        {!state ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="live" className="gap-1"><MonitorPlay className="h-3.5 w-3.5" />{t('classroom.tabLive', 'Ao vivo')}</TabsTrigger>
              <TabsTrigger value="materials" className="gap-1"><ClipboardList className="h-3.5 w-3.5" />{t('classroom.tabMaterials', 'Materiais')}</TabsTrigger>
              <TabsTrigger value="chat" className="gap-1"><MessageSquare className="h-3.5 w-3.5" />{t('classroom.tabChat', 'Chat')}</TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="mt-4">
              {liveMaterial ? (
                <div className="liquid-glass rounded-2xl p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-destructive">
                      <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                      {t('classroom.liveNow', 'AO VIVO')}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{liveMaterial.title}</span>
                  </div>
                  {liveParts.length > 1 && (
                    <div className="mb-4 space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${((Math.min(liveSection, liveParts.length - 1) + 1) / liveParts.length) * 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {t('classroom.part', 'Parte')} {Math.min(liveSection, liveParts.length - 1) + 1} {t('classroom.ofParts', 'de')} {liveParts.length}
                        {livePart ? ` · ${livePart.title}` : ''}
                      </p>
                    </div>
                  )}
                  <ClassroomMaterialView
                    key={`${liveMaterial.id}-${liveSection}`}
                    material={liveMaterial}
                    sectionIndex={liveSection}
                    answerable={liveMaterial.type === 'exercises'}
                    submitting={submitting}
                    submittedScore={myAnswers.find((a) => a.material_id === liveMaterial.id)?.score ?? null}
                    onSubmitAnswers={(a, s) => submitAnswers(liveMaterial.id, a, s)}
                  />
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-10">{t('classroom.waitingTeacher', 'Aguardando o professor iniciar a apresentação...')}</p>
              )}
            </TabsContent>

            <TabsContent value="materials" className="mt-4 space-y-4">
              {(state.materials || []).length === 0 ? (
                <p className="text-center text-muted-foreground py-10">{t('classroom.noMaterials', 'Nenhum material publicado ainda.')}</p>
              ) : (
                (state.materials || []).map((m: any) => (
                  <div key={m.id} className="liquid-glass rounded-2xl p-4">
                    <ClassroomMaterialView
                      material={m}
                      answerable={m.type === 'exercises'}
                      submitting={submitting}
                      submittedScore={myAnswers.find((a) => a.material_id === m.id)?.score ?? null}
                      onSubmitAnswers={(a, s) => submitAnswers(m.id, a, s)}
                    />
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="chat" className="mt-4">
              <div className="liquid-glass rounded-2xl flex flex-col h-[60vh]">
                <ScrollArea className="flex-1 p-4" ref={chatRef as any}>
                  <div className="space-y-3">
                    {(state.messages || []).map((msg: any) => (
                      <div key={msg.id} className={`flex flex-col ${msg.mine ? 'items-end' : 'items-start'}`}>
                        <span className="text-xs text-muted-foreground mb-1">
                          {msg.author_name}{msg.is_teacher ? ` · ${t('classroom.teacher', 'Professor(a)')}` : ''}
                        </span>
                        <div className={`p-3 rounded-2xl max-w-[80%] ${msg.mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-border flex gap-2">
                  <Textarea
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value.slice(0, 800))}
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
        )}
      </div>
    </div>
  );
}
