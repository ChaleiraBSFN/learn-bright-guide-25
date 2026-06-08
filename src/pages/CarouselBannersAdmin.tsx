import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';
import {
  ArrowLeft, Loader2, Trash2, Pencil, X, Send, Images,
  BookOpen, Brain, Dumbbell, Cpu, Map, Trophy, Users, Coins,
  HeartHandshake, MessageSquare, Sparkles, Heart, Star, Zap, Megaphone,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CarouselItemRow {
  id: string;
  item_key: string;
  title: string;
  description: string;
  detail: string;
  examples: string[];
  icon: string;
  color_theme: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

const ICON_OPTIONS: { key: string; Icon: typeof BookOpen }[] = [
  { key: 'book-open', Icon: BookOpen },
  { key: 'brain', Icon: Brain },
  { key: 'dumbbell', Icon: Dumbbell },
  { key: 'cpu', Icon: Cpu },
  { key: 'map', Icon: Map },
  { key: 'trophy', Icon: Trophy },
  { key: 'users', Icon: Users },
  { key: 'coins', Icon: Coins },
  { key: 'heart-handshake', Icon: HeartHandshake },
  { key: 'message-square', Icon: MessageSquare },
  { key: 'sparkles', Icon: Sparkles },
  { key: 'heart', Icon: Heart },
  { key: 'star', Icon: Star },
  { key: 'zap', Icon: Zap },
  { key: 'megaphone', Icon: Megaphone },
];

const THEME_OPTIONS: { key: string; label: string; dot: string }[] = [
  { key: 'primary', label: 'Primária (Azul)', dot: 'bg-primary' },
  { key: 'secondary', label: 'Secundária (Teal)', dot: 'bg-secondary' },
  { key: 'accent', label: 'Destaque (Âmbar)', dot: 'bg-accent' },
  { key: 'violet', label: 'Roxo', dot: 'bg-violet-500' },
  { key: 'rose', label: 'Rosa', dot: 'bg-rose-500' },
];

const emptyForm = {
  item_key: '',
  title: '',
  description: '',
  detail: '',
  examples_text: '',
  icon: 'sparkles',
  color_theme: 'primary',
  sort_order: 0,
  active: true,
};

const CarouselBannersAdmin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);
  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['carousel-items-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('carousel_items')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CarouselItemRow[];
    },
    enabled: !!isAdmin,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['carousel-items-admin'] });
    qc.invalidateQueries({ queryKey: ['carousel-items-active'] });
  };

  const toPayload = (f: typeof emptyForm) => ({
    item_key: f.item_key.trim() || `item-${Date.now()}`,
    title: f.title.trim(),
    description: f.description.trim(),
    detail: f.detail.trim(),
    examples: f.examples_text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    icon: f.icon,
    color_theme: f.color_theme,
    sort_order: f.sort_order || 0,
    active: f.active,
  });

  const addMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof toPayload>) => {
      const { error } = await supabase
        .from('carousel_items')
        .insert({ ...payload, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async (p: ReturnType<typeof toPayload> & { id: string }) => {
      const { id, ...rest } = p;
      const { error } = await supabase.from('carousel_items').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('carousel_items').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('carousel_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (item: CarouselItemRow) => {
    setEditingId(item.id);
    setForm({
      item_key: item.item_key,
      title: item.title,
      description: item.description,
      detail: item.detail || '',
      examples_text: (item.examples || []).join('\n'),
      icon: item.icon,
      color_theme: item.color_theme,
      sort_order: item.sort_order,
      active: item.active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: 'Erro', description: 'Preencha título e descrição.', variant: 'destructive' });
      return;
    }
    try {
      const payload = toPayload(form);
      if (editingId) {
        await updateMutation.mutateAsync({ ...payload, id: editingId });
        toast({ title: 'Card atualizado!' });
      } else {
        await addMutation.mutateAsync(payload);
        toast({ title: 'Card criado!' });
      }
      reset();
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao salvar.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Banners do Carrossel — Admin"
        description="Gerencie os cards do carrossel da página inicial."
        path="/carousel-banners"
      />
      <div className="container max-w-5xl py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Images className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Banners do Carrossel</h1>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? 'Editar card' : 'Adicionar novo card'}
            </CardTitle>
            <CardDescription>
              Estes cards aparecem no carrossel infinito da página inicial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Título *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1"
                  placeholder="Ex: Resumos inteligentes"
                />
              </div>
              <div>
                <Label>Identificador (opcional)</Label>
                <Input
                  value={form.item_key}
                  onChange={(e) => setForm((f) => ({ ...f, item_key: e.target.value }))}
                  className="mt-1 font-mono text-sm"
                  placeholder="summaries"
                />
              </div>
            </div>

            <div>
              <Label>Descrição curta *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 min-h-[60px]"
                placeholder="Aparece no card do carrossel."
              />
            </div>

            <div>
              <Label>Detalhe (aparece ao abrir o card)</Label>
              <Textarea
                value={form.detail}
                onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
                className="mt-1 min-h-[90px]"
              />
            </div>

            <div>
              <Label>Exemplos (um por linha)</Label>
              <Textarea
                value={form.examples_text}
                onChange={(e) => setForm((f) => ({ ...f, examples_text: e.target.value }))}
                className="mt-1 min-h-[90px]"
                placeholder={'Exemplo 1\nExemplo 2\nExemplo 3'}
              />
            </div>

            <div>
              <Label>Símbolo (ícone)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ICON_OPTIONS.map(({ key, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon: key }))}
                    title={key}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${
                      form.icon === key
                        ? 'border-foreground bg-muted scale-110'
                        : 'border-muted hover:border-foreground/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color_theme: opt.key }))}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all ${
                      form.color_theme === opt.key
                        ? 'border-foreground ring-2 ring-offset-1'
                        : 'border-muted'
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ordem (menor aparece primeiro)</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))
                  }
                  className="mt-1 w-32"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  Ativo (aparecer no site)
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={submit}
                disabled={addMutation.isPending || updateMutation.isPending}
                className="gap-2"
              >
                {(addMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {editingId ? 'Salvar alterações' : 'Adicionar card'}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={reset} className="gap-2">
                  <X className="h-4 w-4" /> Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Cards atuais ({items.length})</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum card cadastrado ainda.
            </p>
          ) : (
            items.map((item) => {
              const IconComp =
                ICON_OPTIONS.find((i) => i.key === item.icon)?.Icon || Sparkles;
              const theme = THEME_OPTIONS.find((t) => t.key === item.color_theme);
              return (
                <Card key={item.id} className={!item.active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-foreground/10">
                        <IconComp className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{item.title}</h4>
                          {theme && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
                              {theme.label}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            #{item.sort_order}
                          </Badge>
                          {!item.active && (
                            <Badge variant="outline" className="text-[10px]">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1"
                          onClick={() => startEdit(item)}
                        >
                          <Pencil className="h-3 w-3" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant={item.active ? 'outline' : 'default'}
                          className="text-xs h-7"
                          onClick={() =>
                            toggleMutation.mutate({ id: item.id, active: !item.active })
                          }
                        >
                          {item.active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-destructive"
                          onClick={() => {
                            if (confirm(`Excluir o card "${item.title}"?`)) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CarouselBannersAdmin;
