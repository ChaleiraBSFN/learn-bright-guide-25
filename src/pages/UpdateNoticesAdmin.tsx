import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';
import { ArrowLeft, Megaphone, Loader2, Trash2, Send, Pencil, X, Image as ImageIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateNotice {
  id: string;
  title: string;
  message: string;
  type: string;
  active: boolean;
  created_at: string;
  created_by: string | null;
}

interface PromoBanner {
  id: string;
  title: string;
  description: string;
  cta_label: string;
  route: string;
  icon: string;
  variant: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  start_at: string | null;
  end_at: string | null;
  daily_start_minutes: number | null;
  daily_end_minutes: number | null;
  days_of_week: number[] | null;
  max_per_day: number | null;
  max_per_week: number | null;
}

const typeColors: Record<string, string> = {
  feature: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  improvement: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  bugfix: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  announcement: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
};

const typeLabels: Record<string, string> = {
  feature: '🚀 Nova Feature',
  improvement: '⚡ Melhoria',
  bugfix: '🐛 Correção',
  announcement: '📢 Anúncio',
};

const ICON_OPTIONS = ['users', 'sparkles', 'megaphone', 'trophy', 'book', 'brain', 'dumbbell', 'map', 'coins', 'heart', 'star', 'zap'];
const VARIANT_OPTIONS = [
  { key: 'violet', label: 'Roxo', dot: 'bg-violet-500' },
  { key: 'blue', label: 'Azul', dot: 'bg-blue-500' },
  { key: 'amber', label: 'Âmbar', dot: 'bg-amber-500' },
  { key: 'emerald', label: 'Verde', dot: 'bg-emerald-500' },
  { key: 'rose', label: 'Rosa', dot: 'bg-rose-500' },
];

const ROUTE_OPTIONS: { value: string; label: string }[] = [
  { value: '/', label: '🏠 Início — Gerar conteúdo / exercícios' },
  { value: '/community', label: '👥 Comunidade' },
  { value: '/chat-buddy', label: '💬 Chat com Learn Buddy (IA)' },
  { value: '/install', label: '📲 Baixar App (Instalar)' },
  { value: '/downloads', label: '⬇️ Downloads (Android / Desktop)' },
  { value: '/settings', label: '⚙️ Configurações' },
  { value: '/privacy', label: '🔒 Privacidade' },
  { value: '/auth', label: '🔑 Login / Cadastro' },
];

const NoticesTab = ({ userId }: { userId?: string }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<string>('announcement');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['update-notices-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('update_notices').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as UpdateNotice[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['update-notices-admin'] });
    qc.invalidateQueries({ queryKey: ['update-notices-active'] });
  };

  const addMutation = useMutation({
    mutationFn: async (n: { title: string; message: string; type: string }) => {
      const { error } = await supabase.from('update_notices').insert({ ...n, created_by: userId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async (p: { id: string; title: string; message: string; type: string }) => {
      const { id, ...rest } = p;
      const { error } = await supabase.from('update_notices').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('update_notices').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('update_notices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const resetForm = () => { setEditingId(null); setTitle(''); setMessage(''); setType('announcement'); };

  const startEdit = (n: UpdateNotice) => {
    setEditingId(n.id); setTitle(n.title); setMessage(n.message); setType(n.type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Erro', description: 'Preencha título e mensagem.', variant: 'destructive' });
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, title: title.trim(), message: message.trim(), type });
        toast({ title: 'Aviso atualizado!' });
      } else {
        await addMutation.mutateAsync({ title: title.trim(), message: message.trim(), type });
        toast({ title: 'Aviso criado!' });
      }
      resetForm();
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? 'Editar Aviso' : 'Criar Novo Aviso'}</CardTitle>
          <CardDescription>Avisos pequenos aparecem como barras no topo da tela inicial</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" /></div>
          <div><Label>Mensagem</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} className="mt-1 min-h-[80px]" /></div>
          <div>
            <Label>Tipo</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(typeLabels).map(([key, label]) => (
                <Badge key={key} variant="outline" className={`cursor-pointer text-xs ${type === key ? typeColors[key] + ' ring-2 ring-offset-1' : 'opacity-60'}`} onClick={() => setType(key)}>{label}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={addMutation.isPending || updateMutation.isPending} className="gap-2">
              {(addMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {editingId ? 'Salvar Alterações' : 'Publicar Aviso'}
            </Button>
            {editingId && <Button variant="ghost" onClick={resetForm} className="gap-2"><X className="h-4 w-4" /> Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {notices.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum aviso publicado ainda.</p>}
        {notices.map(notice => (
          <Card key={notice.id} className={!notice.active ? 'opacity-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-[10px] ${typeColors[notice.type]}`}>{typeLabels[notice.type] || notice.type}</Badge>
                    {!notice.active && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                  </div>
                  <h4 className="font-semibold text-sm">{notice.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{notice.message}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => startEdit(notice)}><Pencil className="h-3 w-3" /> Editar</Button>
                  <Button size="sm" variant={notice.active ? 'outline' : 'default'} className="text-xs h-7" onClick={() => toggleMutation.mutate({ id: notice.id, active: !notice.active })}>{notice.active ? 'Desativar' : 'Ativar'}</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => deleteMutation.mutate(notice.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const DOW = [
  { v: 0, l: 'Dom' }, { v: 1, l: 'Seg' }, { v: 2, l: 'Ter' }, { v: 3, l: 'Qua' },
  { v: 4, l: 'Qui' }, { v: 5, l: 'Sex' }, { v: 6, l: 'Sáb' },
];

const minutesToHHMM = (m: number | null) => {
  if (m == null) return '';
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${h}:${mm}`;
};
const hhmmToMinutes = (s: string): number | null => {
  if (!s) return null;
  const [h, m] = s.split(':').map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
};
const isoToLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const localInputToIso = (s: string) => (s ? new Date(s).toISOString() : null);

const PromoBannersTab = ({ userId }: { userId?: string }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const empty = {
    title: '', description: '', cta_label: 'Explorar', route: '/community',
    icon: 'users', variant: 'violet', sort_order: 0,
    start_at: null as string | null, end_at: null as string | null,
    daily_start_minutes: null as number | null, daily_end_minutes: null as number | null,
    days_of_week: null as number[] | null,
    max_per_day: null as number | null, max_per_week: null as number | null,
  };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['promo-banners-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('promo_banners').select('*').order('sort_order').order('created_at', { ascending: false });
      if (error) throw error;
      return data as PromoBanner[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['promo-banners-admin'] });
    qc.invalidateQueries({ queryKey: ['promo-banners-active'] });
  };

  const addMutation = useMutation({
    mutationFn: async (payload: typeof empty) => {
      const { error } = await supabase.from('promo_banners').insert({ ...payload, created_by: userId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async (p: typeof empty & { id: string }) => {
      const { id, ...rest } = p;
      const { error } = await supabase.from('promo_banners').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('promo_banners').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promo_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const reset = () => { setForm(empty); setEditingId(null); };

  const startEdit = (b: PromoBanner) => {
    setEditingId(b.id);
    setForm({
      title: b.title, description: b.description, cta_label: b.cta_label, route: b.route,
      icon: b.icon, variant: b.variant, sort_order: b.sort_order,
      start_at: b.start_at, end_at: b.end_at,
      daily_start_minutes: b.daily_start_minutes, daily_end_minutes: b.daily_end_minutes,
      days_of_week: b.days_of_week,
      max_per_day: b.max_per_day, max_per_week: b.max_per_week,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: 'Erro', description: 'Preencha título e descrição.', variant: 'destructive' });
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ ...form, id: editingId });
        toast({ title: 'Banner atualizado!' });
      } else {
        await addMutation.mutateAsync(form);
        toast({ title: 'Banner criado!' });
      }
      reset();
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? 'Editar Banner Grande' : 'Criar Novo Banner Grande'}</CardTitle>
          <CardDescription>Banners grandes aparecem no topo da tela inicial com ícone, descrição e botão de ação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Título</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="✨ Conheça a Comunidade!" className="mt-1" /></div>
          <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 min-h-[70px]" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Texto do botão</Label><Input value={form.cta_label} onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} className="mt-1" /></div>
            <div>
              <Label>Rota (para onde o botão leva)</Label>
              <Select value={ROUTE_OPTIONS.some(r => r.value === form.route) ? form.route : '__custom'} onValueChange={(v) => { if (v !== '__custom') setForm(f => ({ ...f, route: v })); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Escolha uma rota" /></SelectTrigger>
                <SelectContent>
                  {ROUTE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  <SelectItem value="__custom">✏️ Outra (personalizar abaixo)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={form.route}
                onChange={e => setForm(f => ({ ...f, route: e.target.value }))}
                placeholder="/community"
                className="mt-2 text-xs font-mono"
              />
            </div>
          </div>
          <div>
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {VARIANT_OPTIONS.map(v => (
                <button key={v.key} type="button" onClick={() => setForm(f => ({ ...f, variant: v.key }))}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${form.variant === v.key ? 'border-foreground ring-2 ring-offset-1' : 'border-muted'}`}>
                  <span className={`h-3 w-3 rounded-full ${v.dot}`} />{v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ICON_OPTIONS.map(i => (
                <button key={i} type="button" onClick={() => setForm(f => ({ ...f, icon: i }))}
                  className={`rounded-md border px-2 py-1 text-xs ${form.icon === i ? 'border-foreground bg-muted' : 'border-muted'}`}>{i}</button>
              ))}
            </div>
          </div>
          <div><Label>Ordem (menor aparece primeiro)</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 w-32" /></div>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={addMutation.isPending || updateMutation.isPending} className="gap-2">
              {(addMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {editingId ? 'Salvar Alterações' : 'Publicar Banner'}
            </Button>
            {editingId && <Button variant="ghost" onClick={reset} className="gap-2"><X className="h-4 w-4" /> Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {banners.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum banner publicado ainda.</p>}
        {banners.map(b => (
          <Card key={b.id} className={!b.active ? 'opacity-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{b.variant}</Badge>
                    <Badge variant="outline" className="text-[10px]">{b.icon}</Badge>
                    <Badge variant="outline" className="text-[10px]">→ {b.route}</Badge>
                    {!b.active && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                  </div>
                  <h4 className="font-semibold text-sm truncate">{b.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.description}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => startEdit(b)}><Pencil className="h-3 w-3" /> Editar</Button>
                  <Button size="sm" variant={b.active ? 'outline' : 'default'} className="text-xs h-7" onClick={() => toggleMutation.mutate({ id: b.id, active: !b.active })}>{b.active ? 'Desativar' : 'Ativar'}</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => deleteMutation.mutate(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const UpdateNoticesAdmin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);
  useEffect(() => { if (!adminLoading && !isAdmin && user) navigate('/'); }, [isAdmin, adminLoading, user, navigate]);

  if (authLoading || adminLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Avisos & Banners — Learn Buddy" description="Gerencie avisos e banners promocionais da plataforma." path="/update-notices" />
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-accent" />
            <h1 className="text-xl sm:text-2xl font-bold">Avisos & Banners</h1>
          </div>
        </div>

        <Tabs defaultValue="notices">
          <TabsList className="mb-4">
            <TabsTrigger value="notices" className="gap-1.5"><Megaphone className="h-4 w-4" /> Avisos pequenos</TabsTrigger>
            <TabsTrigger value="banners" className="gap-1.5"><ImageIcon className="h-4 w-4" /> Banners grandes</TabsTrigger>
          </TabsList>
          <TabsContent value="notices"><NoticesTab userId={user?.id} /></TabsContent>
          <TabsContent value="banners"><PromoBannersTab userId={user?.id} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UpdateNoticesAdmin;
