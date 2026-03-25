import { useTranslation } from 'react-i18next';
import { useEngineNotices } from '@/hooks/useEngineNotices';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Cpu, Sparkles, Zap, Brain, Image, BookOpen, PenTool,
  Activity, Shield, Server, Database, Globe, Clock,
  CheckCircle2, AlertTriangle, XCircle, Gauge, Wifi,
  HardDrive, MemoryStick, RefreshCw, Lock, Eye, Languages
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type StatusType = 'active' | 'maintenance' | 'inactive';

const StatusBadge = ({ status, t }: { status: StatusType; t: (key: string) => string }) => {
  const config = {
    active: { icon: CheckCircle2, label: t('aiInfo.statusActive'), className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
    maintenance: { icon: AlertTriangle, label: t('aiInfo.statusMaintenance'), className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
    inactive: { icon: XCircle, label: t('aiInfo.statusInactive'), className: 'bg-destructive/15 text-destructive border-destructive/30' },
  };
  const { icon: Icon, label, className } = config[status];
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 px-1.5 py-0.5 ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

export const AIInfoDialog = () => {
  const { t } = useTranslation();
  const { data: engineNotices } = useEngineNotices();

  const engineKeyToI18n: Record<string, { name: string; icon: any; detail: string }> = {
    content_engine: { name: t('aiInfo.sysContentEngine'), icon: BookOpen, detail: t('aiInfo.sysContentDetail') },
    exercise_engine: { name: t('aiInfo.sysExerciseEngine'), icon: PenTool, detail: t('aiInfo.sysExerciseDetail') },
    correction_engine: { name: t('aiInfo.sysCorrectionEngine'), icon: Brain, detail: t('aiInfo.sysCorrectionDetail') },
    image_engine: { name: t('aiInfo.sysImageEngine'), icon: Image, detail: t('aiInfo.sysImageDetail') },
    translation_engine: { name: t('aiInfo.sysTranslationEngine'), icon: Languages, detail: t('aiInfo.sysTranslationDetail') },
    auth: { name: t('aiInfo.sysAuth'), icon: Lock, detail: t('aiInfo.sysAuthDetail') },
    database: { name: t('aiInfo.sysDatabase'), icon: Database, detail: t('aiInfo.sysDatabaseDetail') },
    realtime: { name: t('aiInfo.sysRealtime'), icon: Wifi, detail: t('aiInfo.sysRealtimeDetail') },
    storage: { name: t('aiInfo.sysStorage'), icon: HardDrive, detail: t('aiInfo.sysStorageDetail') },
    cdn: { name: t('aiInfo.sysCDN'), icon: Globe, detail: t('aiInfo.sysCDNDetail') },
    rate_limit: { name: t('aiInfo.sysRateLimit'), icon: Shield, detail: t('aiInfo.sysRateLimitDetail') },
  };

  const systemStatus = (engineNotices || []).map((notice) => {
    const i18nData = engineKeyToI18n[notice.engine_key];
    return {
      name: i18nData?.name || notice.engine_name,
      icon: i18nData?.icon || Shield,
      status: notice.status as StatusType,
      detail: notice.notice_message || i18nData?.detail || '',
    };
  });

  const metrics = [
    { label: t('aiInfo.metricLatency'), value: '~1.2s', icon: Clock, progress: 88 },
    { label: t('aiInfo.metricReliability'), value: '99.7%', icon: Activity, progress: 99 },
    { label: t('aiInfo.metricUptime'), value: '99.9%', icon: Server, progress: 99 },
    { label: t('aiInfo.metricThroughput'), value: '~45 req/s', icon: Gauge, progress: 75 },
  ];

  const models = [
    {
      name: 'Gemini 2.5 Flash',
      version: 'v2.5.0',
      provider: 'Google DeepMind',
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      usage: t('aiInfo.textGeneration'),
      context: '1M tokens',
      maxOutput: '16K tokens',
      speed: t('aiInfo.fast'),
      details: t('aiInfo.flashDetails'),
    },
    {
      name: 'Gemini 2.5 Flash Lite',
      version: 'v2.5.0-lite',
      provider: 'Google DeepMind',
      icon: Sparkles,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      usage: t('aiInfo.freeGeneration'),
      context: '1M tokens',
      maxOutput: '8K tokens',
      speed: t('aiInfo.veryFast'),
      details: t('aiInfo.flashLiteDetails'),
    },
    {
      name: 'Gemini 3.1 Flash Image',
      version: 'v3.1-preview',
      provider: 'Google DeepMind',
      icon: Image,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      usage: t('aiInfo.imageGeneration'),
      context: '1M tokens',
      maxOutput: t('aiInfo.imagesAndText'),
      speed: t('aiInfo.moderate'),
      details: t('aiInfo.imageModelDetails'),
    },
    {
      name: 'Gemini 2.5 Flash (Translate)',
      version: 'v2.5.0',
      provider: 'Google DeepMind',
      icon: Languages,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      usage: t('aiInfo.translationUsage'),
      context: '1M tokens',
      maxOutput: '16K tokens',
      speed: t('aiInfo.fast'),
      details: t('aiInfo.translationModelDetails'),
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Cpu className="h-4 w-4 mr-2 text-primary" />
          {t('aiInfo.menuTitle')}
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-display">
            <Cpu className="h-5 w-5 text-primary" />
            {t('aiInfo.dialogTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Overall Status Banner */}
          {(() => {
            const hasIssues = systemStatus.some(s => s.status !== 'active');
            return (
              <div className={`rounded-xl p-3 flex items-center gap-3 ${
                hasIssues 
                  ? 'bg-amber-500/10 border border-amber-500/30' 
                  : 'bg-emerald-500/10 border border-emerald-500/30'
              }`}>
                <div className={`p-2 rounded-lg ${hasIssues ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                  {hasIssues 
                    ? <AlertTriangle className="h-5 w-5 text-amber-600" />
                    : <Activity className="h-5 w-5 text-emerald-600" />
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold font-display text-foreground">
                    {hasIssues ? t('aiInfo.someSystemsIssues') : t('aiInfo.allSystemsOperational')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('aiInfo.lastChecked')}</p>
                </div>
              </div>
            );
          })()}

          {/* Performance Metrics */}
          <div>
            <h3 className="text-sm font-bold font-display text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              {t('aiInfo.performanceTitle')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-lg border border-border p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <m.icon className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[11px] font-medium text-muted-foreground">{m.label}</span>
                    </div>
                    <span className="text-xs font-bold font-display text-foreground">{m.value}</span>
                  </div>
                  <Progress value={m.progress} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div>
            <h3 className="text-sm font-bold font-display text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Server className="h-4 w-4" />
              {t('aiInfo.systemStatusTitle')}
            </h3>
            <div className="space-y-1.5">
              {systemStatus.map((sys) => (
                <div key={sys.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <sys.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{sys.name}</p>
                      <p className="text-[10px] text-muted-foreground">{sys.detail}</p>
                    </div>
                  </div>
                  <StatusBadge status={sys.status} t={t} />
                </div>
              ))}
            </div>
          </div>

          {/* AI Models */}
          <div>
            <h3 className="text-sm font-bold font-display text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              {t('aiInfo.modelsTitle')}
            </h3>
            <div className="space-y-3">
              {models.map((model) => (
                <div key={model.name} className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${model.bgColor}`}>
                        <model.icon className={`h-4 w-4 ${model.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold font-display text-foreground">{model.name}</p>
                        <p className="text-[10px] text-muted-foreground">{model.provider} · {model.version}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {model.speed}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5 pl-9">
                    <p><span className="font-medium text-foreground">{t('aiInfo.usage')}:</span> {model.usage}</p>
                    <p><span className="font-medium text-foreground">{t('aiInfo.context')}:</span> {model.context}</p>
                    <p><span className="font-medium text-foreground">{t('aiInfo.maxOutput')}:</span> {model.maxOutput}</p>
                    <p className="pt-0.5 italic">{model.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h3 className="text-sm font-bold font-display text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('aiInfo.capabilitiesTitle')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: BookOpen, label: t('aiInfo.capStudyContent'), color: 'text-primary' },
                { icon: PenTool, label: t('aiInfo.capExercises'), color: 'text-secondary' },
                { icon: Brain, label: t('aiInfo.capCorrection'), color: 'text-accent' },
                { icon: Image, label: t('aiInfo.capImages'), color: 'text-purple-500' },
                { icon: Languages, label: t('aiInfo.capTranslation'), color: 'text-blue-500' },
                { icon: RefreshCw, label: t('aiInfo.capFallback'), color: 'text-muted-foreground' },
                { icon: Shield, label: t('aiInfo.capRateLimit'), color: 'text-muted-foreground' },
              ].map((cap) => (
                <div key={cap.label} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                  <cap.icon className={`h-4 w-4 ${cap.color} shrink-0`} />
                  <span className="text-xs font-medium text-foreground">{cap.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border">
            {t('aiInfo.footer')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
