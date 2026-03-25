import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useEngineNotices, useUpdateEngineNotice, EngineNotice } from '@/hooks/useEngineNotices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Shield, Loader2, CheckCircle2, AlertTriangle, XCircle,
  BookOpen, PenTool, Brain, Image, Languages, Lock, Database, Wifi,
  HardDrive, Globe, ShieldCheck
} from 'lucide-react';

const engineIcons: Record<string, any> = {
  content_engine: BookOpen,
  exercise_engine: PenTool,
  correction_engine: Brain,
  image_engine: Image,
  translation_engine: Languages,
  auth: Lock,
  database: Database,
  realtime: Wifi,
  storage: HardDrive,
  cdn: Globe,
  rate_limit: ShieldCheck,
};

const statusConfig = {
  active: { label: 'Ativo', icon: CheckCircle2, color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  maintenance: { label: 'Manutenção', icon: AlertTriangle, color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  inactive: { label: 'Inativo', icon: XCircle, color: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const EngineNoticeCard = ({ notice }: { notice: EngineNotice }) => {
  const { toast } = useToast();
  const updateMutation = useUpdateEngineNotice();
  const [message, setMessage] = useState(notice.notice_message || '');
  const [showBanner, setShowBanner] = useState(notice.show_banner);

  const Icon = engineIcons[notice.engine_key] || Shield;
  const currentStatus = statusConfig[notice.status];

  const handleStatusChange = async (newStatus: 'active' | 'maintenance' | 'inactive') => {
    try {
      await updateMutation.mutateAsync({ id: notice.id, status: newStatus });
      toast({ title: 'Atualizado', description: `${notice.engine_name} agora está ${statusConfig[newStatus].label}.` });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao atualizar status.', variant: 'destructive' });
    }
  };

  const handleSaveMessage = async () => {
    try {
      await updateMutation.mutateAsync({
        id: notice.id,
        notice_message: message || null,
        show_banner: showBanner,
      });
      toast({ title: 'Salvo', description: 'Aviso atualizado com sucesso.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar aviso.', variant: 'destructive' });
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-5 w-5 text-muted-foreground" />
            {notice.engine_name}
          </CardTitle>
          <Badge variant="outline" className={`text-xs gap-1 ${currentStatus.color}`}>
            <currentStatus.icon className="h-3 w-3" />
            {currentStatus.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={notice.status === 'active' ? 'default' : 'outline'}
            className="gap-1 text-xs flex-1 min-w-0"
            onClick={() => handleStatusChange('active')}
            disabled={updateMutation.isPending}
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Ativar</span>
          </Button>
          <Button
            size="sm"
            variant={notice.status === 'maintenance' ? 'default' : 'outline'}
            className="gap-1 text-xs flex-1 min-w-0"
            onClick={() => handleStatusChange('maintenance')}
            disabled={updateMutation.isPending}
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Manutenção</span>
          </Button>
          <Button
            size="sm"
            variant={notice.status === 'inactive' ? 'destructive' : 'outline'}
            className="gap-1 text-xs flex-1 min-w-0"
            onClick={() => handleStatusChange('inactive')}
            disabled={updateMutation.isPending}
          >
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Inativar</span>
          </Button>
        </div>

        {/* Notice Message */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Mensagem de aviso (aparece na tela inicial)</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: Motor de imagens em manutenção programada até 15h..."
            className="text-sm min-h-[60px]"
          />
        </div>

        {/* Show Banner Toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Exibir banner na tela inicial</Label>
          <Switch checked={showBanner} onCheckedChange={setShowBanner} />
        </div>

        <Button
          size="sm"
          onClick={handleSaveMessage}
          disabled={updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Aviso'}
        </Button>
      </CardContent>
    </Card>
  );
};

const EngineNoticesAdmin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { data: notices, isLoading } = useEngineNotices();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

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
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold truncate">Aviso de Motores</h1>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Gerencie o status dos motores da IA e crie avisos que aparecerão na tela inicial para os usuários.
        </p>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {notices?.map((notice) => (
            <EngineNoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EngineNoticesAdmin;
