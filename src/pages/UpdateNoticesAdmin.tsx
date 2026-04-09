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
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Megaphone, Loader2, Trash2, Send } from 'lucide-react';
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

const UpdateNoticesAdmin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<string>('announcement');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['update-notices-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('update_notices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UpdateNotice[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (notice: { title: string; message: string; type: string }) => {
      const { error } = await supabase.from('update_notices').insert({
        title: notice.title,
        message: notice.message,
        type: notice.type,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['update-notices-admin'] });
      qc.invalidateQueries({ queryKey: ['update-notices-active'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('update_notices').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['update-notices-admin'] });
      qc.invalidateQueries({ queryKey: ['update-notices-active'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('update_notices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['update-notices-admin'] });
      qc.invalidateQueries({ queryKey: ['update-notices-active'] });
    },
  });

  const handleAdd = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Erro', description: 'Preencha título e mensagem.', variant: 'destructive' });
      return;
    }
    try {
      await addMutation.mutateAsync({ title: title.trim(), message: message.trim(), type });
      setTitle('');
      setMessage('');
      toast({ title: 'Aviso criado!', description: 'O aviso aparecerá para todos os usuários.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao criar aviso.', variant: 'destructive' });
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, active: !currentActive });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao atualizar.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Aviso removido!' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao remover.', variant: 'destructive' });
    }
  };

  if (authLoading || adminLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-accent" />
            <h1 className="text-xl sm:text-2xl font-bold">Avisos de Atualizações</h1>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Criar Novo Aviso</CardTitle>
            <CardDescription>Avisos aparecem na tela inicial para todos os usuários</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Nova Trilha de Progresso chegando!" className="mt-1" />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Descreva a novidade..." className="mt-1 min-h-[80px]" />
            </div>
            <div>
              <Label>Tipo</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(typeLabels).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant="outline"
                    className={`cursor-pointer text-xs ${type === key ? typeColors[key] + ' ring-2 ring-offset-1' : 'opacity-60'}`}
                    onClick={() => setType(key)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={handleAdd} disabled={addMutation.isPending} className="gap-2">
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publicar Aviso
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {notices.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum aviso publicado ainda.</p>
          )}
          {notices.map(notice => (
            <Card key={notice.id} className={`border ${!notice.active ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-[10px] ${typeColors[notice.type]}`}>
                        {typeLabels[notice.type] || notice.type}
                      </Badge>
                      {!notice.active && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                    </div>
                    <h4 className="font-semibold text-sm">{notice.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{notice.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(notice.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant={notice.active ? 'outline' : 'default'}
                      className="text-xs h-7"
                      onClick={() => handleToggle(notice.id, notice.active)}
                      disabled={toggleMutation.isPending}
                    >
                      {notice.active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-destructive"
                      onClick={() => handleDelete(notice.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpdateNoticesAdmin;
