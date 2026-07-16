import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, ToggleLeft } from 'lucide-react';
import { SEO } from '@/components/SEO';

type Flag = {
  id: string;
  section_key: string;
  enabled: boolean;
  title: string;
  message: string;
  cta_label: string | null;
  cta_url: string | null;
};

const SectionFlagsAdmin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);
  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('section_flags')
      .select('*')
      .order('section_key');
    setFlags((data as Flag[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const update = (id: string, patch: Partial<Flag>) => {
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const save = async (flag: Flag) => {
    setSavingId(flag.id);
    const { error } = await supabase
      .from('section_flags')
      .update({
        enabled: flag.enabled,
        title: flag.title,
        message: flag.message,
        cta_label: flag.cta_label,
        cta_url: flag.cta_url,
      })
      .eq('id', flag.id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else toast.success(t('adminSections.saved', 'Salvo!'));
  };

  const toggleAll = async (enabled: boolean) => {
    const { error } = await supabase
      .from('section_flags')
      .update({ enabled })
      .not('id', 'is', null);
    if (error) toast.error(error.message);
    else {
      toast.success(t('adminSections.saved', 'Salvo!'));
      load();
    }
  };

  if (authLoading || adminLoading || loading) {
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
        title="Controle de Seções — Learn Buddy"
        description="Ative ou desative seções do app e configure mensagens de manutenção."
        path="/section-flags"
      />
      <div className="container max-w-5xl py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <ToggleLeft className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">
              {t('adminSections.title', 'Controle de Seções')}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
            {t('adminSections.enableAll', 'Ativar todas')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
            {t('adminSections.disableAll', 'Desativar todas')}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {t(
            'adminSections.help',
            'Desative uma seção para mostrar uma mensagem de "em desenvolvimento" com botão de redirecionamento. Todas as alterações são aplicadas em tempo real para todos os usuários.',
          )}
        </p>

        <div className="grid gap-4">
          {flags.map((flag) => (
            <Card key={flag.id} className="p-4">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <div className="font-mono text-sm font-bold text-primary">
                    {flag.section_key}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">
                    {flag.enabled
                      ? t('adminSections.enabled', 'Ativa')
                      : t('adminSections.disabled', 'Em desenvolvimento')}
                  </Label>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(v) => update(flag.id, { enabled: v })}
                  />
                </div>
              </div>

              {!flag.enabled && (
                <div className="grid gap-3 md:grid-cols-2 pt-3 border-t">
                  <div>
                    <Label className="text-xs">
                      {t('adminSections.fieldTitle', 'Título')}
                    </Label>
                    <Input
                      value={flag.title}
                      onChange={(e) => update(flag.id, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">
                      {t('adminSections.fieldCtaLabel', 'Texto do botão (opcional)')}
                    </Label>
                    <Input
                      value={flag.cta_label ?? ''}
                      onChange={(e) => update(flag.id, { cta_label: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">
                      {t('adminSections.fieldMessage', 'Mensagem')}
                    </Label>
                    <Textarea
                      value={flag.message}
                      onChange={(e) => update(flag.id, { message: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">
                      {t('adminSections.fieldCtaUrl', 'URL do botão (opcional)')}
                    </Label>
                    <Input
                      value={flag.cta_url ?? ''}
                      placeholder="/community  ou  https://..."
                      onChange={(e) => update(flag.id, { cta_url: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-3">
                <Button
                  size="sm"
                  onClick={() => save(flag)}
                  disabled={savingId === flag.id}
                  className="gap-2"
                >
                  {savingId === flag.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {t('common.save', 'Salvar')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectionFlagsAdmin;
