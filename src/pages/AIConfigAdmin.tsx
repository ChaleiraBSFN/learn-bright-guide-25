import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft, Loader2, Cpu, Plus, Trash2, Save, Gauge, Sparkles, Eye,
  Zap, Brain, Image, BookOpen, PenTool, Languages, Shield, RefreshCw,
  HardDrive, Globe, Activity, Server, Database, Clock, Wifi, Lock, GripVertical,
  FileText
} from 'lucide-react';

const ICON_OPTIONS: { value: string; label: string; icon: any }[] = [
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'brain', label: 'Brain', icon: Brain },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'book-open', label: 'Book Open', icon: BookOpen },
  { value: 'pen-tool', label: 'Pen Tool', icon: PenTool },
  { value: 'languages', label: 'Languages', icon: Languages },
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'refresh-cw', label: 'Refresh', icon: RefreshCw },
  { value: 'hard-drive', label: 'Hard Drive', icon: HardDrive },
  { value: 'globe', label: 'Globe', icon: Globe },
  { value: 'activity', label: 'Activity', icon: Activity },
  { value: 'server', label: 'Server', icon: Server },
  { value: 'database', label: 'Database', icon: Database },
  { value: 'clock', label: 'Clock', icon: Clock },
  { value: 'wifi', label: 'Wifi', icon: Wifi },
  { value: 'lock', label: 'Lock', icon: Lock },
  { value: 'cpu', label: 'CPU', icon: Cpu },
  { value: 'gauge', label: 'Gauge', icon: Gauge },
  { value: 'eye', label: 'Eye', icon: Eye },
];

const COLOR_OPTIONS = [
  { value: 'amber', label: 'Amarelo' },
  { value: 'emerald', label: 'Verde' },
  { value: 'purple', label: 'Roxo' },
  { value: 'blue', label: 'Azul' },
  { value: 'red', label: 'Vermelho' },
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'accent', label: 'Accent' },
  { value: 'muted', label: 'Muted' },
];

type ConfigItem = {
  id?: string;
  section: string;
  sort_order: number;
  config_data: Record<string, any>;
  isNew?: boolean;
};

const AIConfigAdmin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [metrics, setMetrics] = useState<ConfigItem[]>([]);
  const [models, setModels] = useState<ConfigItem[]>([]);
  const [capabilities, setCapabilities] = useState<ConfigItem[]>([]);
  const [footerItems, setFooterItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_config')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setMetrics(data.filter(d => d.section === 'metric').map(d => ({ ...d, config_data: d.config_data as Record<string, any> })));
      setModels(data.filter(d => d.section === 'model').map(d => ({ ...d, config_data: d.config_data as Record<string, any> })));
      setCapabilities(data.filter(d => d.section === 'capability').map(d => ({ ...d, config_data: d.config_data as Record<string, any> })));
      setFooterItems(data.filter(d => d.section === 'footer').map(d => ({ ...d, config_data: d.config_data as Record<string, any> })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const saveSection = async (section: string, items: ConfigItem[]) => {
    setSaving(true);
    try {
      // Delete removed items
      const { data: existing } = await supabase.from('ai_config').select('id').eq('section', section);
      const existingIds = (existing || []).map(e => e.id);
      const keepIds = items.filter(i => i.id && !i.isNew).map(i => i.id!);
      const toDelete = existingIds.filter(id => !keepIds.includes(id));
      
      if (toDelete.length > 0) {
        await supabase.from('ai_config').delete().in('id', toDelete);
      }

      // Upsert all items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.id && !item.isNew) {
          await supabase.from('ai_config').update({
            config_data: item.config_data,
            sort_order: i,
            updated_at: new Date().toISOString(),
          }).eq('id', item.id);
        } else {
          await supabase.from('ai_config').insert({
            section,
            sort_order: i,
            config_data: item.config_data,
          });
        }
      }

      toast({ title: 'Salvo com sucesso!' });
      await loadConfig();
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
    setSaving(false);
  };

  const updateField = (
    items: ConfigItem[],
    setItems: React.Dispatch<React.SetStateAction<ConfigItem[]>>,
    index: number,
    field: string,
    value: any
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], config_data: { ...updated[index].config_data, [field]: value } };
    setItems(updated);
  };

  const removeItem = (items: ConfigItem[], setItems: React.Dispatch<React.SetStateAction<ConfigItem[]>>, index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const getIconComponent = (iconName: string) => {
    const found = ICON_OPTIONS.find(i => i.value === iconName);
    return found ? found.icon : Cpu;
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
      <div className="container max-w-4xl py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Configurar Dados da IA</h1>
          </div>
        </div>

        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" /> Métricas
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Modelos
            </TabsTrigger>
            <TabsTrigger value="capabilities" className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Capacidades
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Rodapé
            </TabsTrigger>
          </TabsList>

          {/* METRICS TAB */}
          <TabsContent value="metrics" className="space-y-4">
            {metrics.map((item, idx) => (
              <Card key={item.id || idx}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Métrica #{idx + 1}</span>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(metrics, setMetrics, idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="Label" value={item.config_data.label || ''} onChange={e => updateField(metrics, setMetrics, idx, 'label', e.target.value)} />
                    <Input placeholder="Valor (ex: 99.9%)" value={item.config_data.value || ''} onChange={e => updateField(metrics, setMetrics, idx, 'value', e.target.value)} />
                    <Input type="number" placeholder="Progresso (0-100)" min={0} max={100} value={item.config_data.progress || 0} onChange={e => updateField(metrics, setMetrics, idx, 'progress', parseInt(e.target.value) || 0)} />
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setMetrics([...metrics, { section: 'metric', sort_order: metrics.length, config_data: { label: '', value: '', progress: 50 }, isNew: true }])}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar Métrica
              </Button>
              <Button onClick={() => saveSection('metric', metrics)} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Métricas'}
              </Button>
            </div>
          </TabsContent>

          {/* MODELS TAB */}
          <TabsContent value="models" className="space-y-4">
            {models.map((item, idx) => {
              const IconComp = getIconComponent(item.config_data.icon);
              return (
                <Card key={item.id || idx}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2">
                        <IconComp className="h-5 w-5 text-primary" />
                        {item.config_data.name || 'Novo Modelo'}
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(models, setModels, idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Nome" value={item.config_data.name || ''} onChange={e => updateField(models, setModels, idx, 'name', e.target.value)} />
                      <Input placeholder="Versão" value={item.config_data.version || ''} onChange={e => updateField(models, setModels, idx, 'version', e.target.value)} />
                      <Input placeholder="Provider" value={item.config_data.provider || ''} onChange={e => updateField(models, setModels, idx, 'provider', e.target.value)} />
                      <Input placeholder="Velocidade" value={item.config_data.speed || ''} onChange={e => updateField(models, setModels, idx, 'speed', e.target.value)} />
                      <Input placeholder="Uso" value={item.config_data.usage || ''} onChange={e => updateField(models, setModels, idx, 'usage', e.target.value)} />
                      <Input placeholder="Contexto" value={item.config_data.context || ''} onChange={e => updateField(models, setModels, idx, 'context', e.target.value)} />
                      <Input placeholder="Max Output" value={item.config_data.maxOutput || ''} onChange={e => updateField(models, setModels, idx, 'maxOutput', e.target.value)} />
                      <div className="flex gap-2">
                        <Select value={item.config_data.icon || 'zap'} onValueChange={v => updateField(models, setModels, idx, 'icon', v)}>
                          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-2"><opt.icon className="h-4 w-4" />{opt.label}</div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={item.config_data.color || 'amber'} onValueChange={v => updateField(models, setModels, idx, 'color', v)}>
                          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {COLOR_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Textarea placeholder="Detalhes do modelo..." value={item.config_data.details || ''} onChange={e => updateField(models, setModels, idx, 'details', e.target.value)} rows={2} />
                  </CardContent>
                </Card>
              );
            })}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setModels([...models, { section: 'model', sort_order: models.length, config_data: { name: '', version: '', provider: '', icon: 'zap', color: 'amber', usage: '', context: '', maxOutput: '', speed: '', details: '' }, isNew: true }])}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar Modelo
              </Button>
              <Button onClick={() => saveSection('model', models)} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Modelos'}
              </Button>
            </div>
          </TabsContent>

          {/* CAPABILITIES TAB */}
          <TabsContent value="capabilities" className="space-y-4">
            {capabilities.map((item, idx) => {
              const IconComp = getIconComponent(item.config_data.icon);
              return (
                <Card key={item.id || idx}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <IconComp className="h-5 w-5 text-primary shrink-0" />
                      <Input placeholder="Nome da capacidade" value={item.config_data.label || ''} onChange={e => updateField(capabilities, setCapabilities, idx, 'label', e.target.value)} className="flex-1" />
                      <Select value={item.config_data.icon || 'cpu'} onValueChange={v => updateField(capabilities, setCapabilities, idx, 'icon', v)}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2"><opt.icon className="h-4 w-4" />{opt.label}</div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={item.config_data.color || 'primary'} onValueChange={v => updateField(capabilities, setCapabilities, idx, 'color', v)}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COLOR_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(capabilities, setCapabilities, idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCapabilities([...capabilities, { section: 'capability', sort_order: capabilities.length, config_data: { label: '', icon: 'cpu', color: 'primary' }, isNew: true }])}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar Capacidade
              </Button>
              <Button onClick={() => saveSection('capability', capabilities)} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Capacidades'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIConfigAdmin;
