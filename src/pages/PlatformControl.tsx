import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Settings2, Loader2, Map, Users, Megaphone, BookOpen, Zap } from 'lucide-react';

interface PlatformSettings {
  trailEnabled: boolean;
  groupsEnabled: boolean;
  updateNoticesEnabled: boolean;
  creditsEnabled: boolean;
  contentGenerationEnabled: boolean;
}

const defaultSettings: PlatformSettings = {
  trailEnabled: true,
  groupsEnabled: true,
  updateNoticesEnabled: true,
  creditsEnabled: true,
  contentGenerationEnabled: true,
};

const PlatformControl = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => {
    const stored = localStorage.getItem('lb_platform_settings');
    if (stored) setSettings(JSON.parse(stored));
    setLoading(false);
  }, []);

  const updateSetting = (key: keyof PlatformSettings, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('lb_platform_settings', JSON.stringify(updated));
    toast({ title: 'Configuração atualizada!', description: `${key} agora está ${value ? 'ativado' : 'desativado'}.` });
  };

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const controls = [
    {
      key: 'trailEnabled' as const,
      icon: Map,
      title: 'Trilha de Progresso',
      description: 'Quando desativada, a trilha continua visível mas sem desafios ativos. Mostra um aviso sobre a próxima atualização.',
      color: 'text-accent',
    },
    {
      key: 'groupsEnabled' as const,
      icon: Users,
      title: 'Grupos de Estudo',
      description: 'Desativa temporariamente o acesso aos grupos de estudo. O botão flutuante desaparece.',
      color: 'text-primary',
    },
    {
      key: 'updateNoticesEnabled' as const,
      icon: Megaphone,
      title: 'Avisos de Atualizações',
      description: 'Controla se os avisos de atualização aparecem para os usuários na tela inicial.',
      color: 'text-purple-500',
    },
    {
      key: 'creditsEnabled' as const,
      icon: Zap,
      title: 'Sistema de Créditos',
      description: 'Quando desativado, não consome créditos ao gerar conteúdo (acesso livre).',
      color: 'text-secondary',
    },
    {
      key: 'contentGenerationEnabled' as const,
      icon: BookOpen,
      title: 'Geração de Conteúdo',
      description: 'Controle mestre: desativa toda geração de conteúdo e exercícios da plataforma.',
      color: 'text-destructive',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-secondary" />
            <h1 className="text-xl sm:text-2xl font-bold">Controle da Plataforma</h1>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Ative ou desative funcionalidades da plataforma em tempo real. As mudanças são aplicadas imediatamente.
        </p>

        <div className="space-y-4">
          {controls.map(ctrl => {
            const Icon = ctrl.icon;
            const isEnabled = settings[ctrl.key];
            return (
              <Card key={ctrl.key} className={`transition-all ${!isEnabled ? 'opacity-70 border-dashed' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${isEnabled ? ctrl.color : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-sm">{ctrl.title}</h4>
                        <Badge variant="outline" className={`text-[10px] ${isEnabled ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-destructive/15 text-destructive border-destructive/30'}`}>
                          {isEnabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{ctrl.description}</p>
                    </div>
                    <Switch checked={isEnabled} onCheckedChange={(v) => updateSetting(ctrl.key, v)} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlatformControl;
