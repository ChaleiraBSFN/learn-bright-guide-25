import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Shield, Loader2, BarChart3, MessageCircle, AlertTriangle, Megaphone, Settings2, Map, Plus, Save, Trash2 } from 'lucide-react';
import { useAchievementData, TrailNodeDef, availableIcons } from '@/hooks/useAchievements';
import { useToast } from '@/hooks/use-toast';

const AdminAchievementsEditor = ({ onBack }: { onBack: () => void }) => {
  const { nodes, saveNodes } = useAchievementData();
  const [editingNodes, setEditingNodes] = useState<TrailNodeDef[]>(nodes);
  const { toast } = useToast();

  useEffect(() => {
    setEditingNodes(nodes);
  }, [nodes]);

  const updateNode = (id: number, field: keyof TrailNodeDef, value: any) => {
    setEditingNodes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const addNode = () => {
    const newId = Math.max(0, ...editingNodes.map(n => n.id)) + 1;
    const newNode: TrailNodeDef = {
      id: newId, title: 'Nova Conquista', type: 'challenge', creditReward: 1, iconName: 'Star',
      x: 100, y: 150, parents: [], objective: 'Descrição do objetivo aqui.', triggerType: 'none', triggerRequirement: 0
    };
    setEditingNodes([...editingNodes, newNode]);
  };

  const removeNode = (id: number) => setEditingNodes(prev => prev.filter(n => n.id !== id));

  const handleSave = () => {
    saveNodes(editingNodes);
    toast({ title: 'Sucesso!', description: 'Todas as conquistas foram atualizadas.' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" /> Editor da Trilha
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addNode}><Plus className="h-4 w-4 mr-2" /> Novo Nó</Button>
          <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Salvar Tudo</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {editingNodes.map(node => (
          <Card key={node.id} className="overflow-hidden">
            <CardContent className="p-4 sm:p-6 grid gap-4 grid-cols-1 md:grid-cols-12 items-start">
              <div className="md:col-span-1 flex flex-col items-center justify-center h-full gap-2">
                <div className="text-lg font-bold text-muted-foreground">#{node.id}</div>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeNode(node.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="md:col-span-3 space-y-3">
                <div>
                  <Label>Título</Label>
                  <Input value={node.title} onChange={e => updateNode(node.id, 'title', e.target.value)} />
                </div>
                <div>
                  <Label>Tipo Visual</Label>
                  <Select value={node.type} onValueChange={v => updateNode(node.id, 'type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="challenge">Desafio</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="milestone">Marco (Milestone)</SelectItem>
                      <SelectItem value="reward">Recompensa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="md:col-span-3 space-y-3">
                <div>
                  <Label>Ícone</Label>
                  <Select value={node.iconName} onValueChange={v => updateNode(node.id, 'iconName', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(availableIcons).map(icon => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Créditos (+)</Label>
                  <Input type="number" value={node.creditReward} onChange={e => updateNode(node.id, 'creditReward', parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <div>
                  <Label>Posição X (Lado)</Label>
                  <Input type="number" value={node.x} onChange={e => updateNode(node.id, 'x', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Posição Y (Topo)</Label>
                  <Input type="number" value={node.y} onChange={e => updateNode(node.id, 'y', parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="md:col-span-3 space-y-3">
                <div>
                  <Label>Pai (ID das ligações)</Label>
                  <Input value={node.parents.join(', ')} onChange={e => updateNode(node.id, 'parents', e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)))} />
                </div>
                <div>
                  <Label>Gatilho (Como desbloqueia?)</Label>
                  <Select value={node.triggerType || 'none'} onValueChange={v => updateNode(node.id, 'triggerType', v === 'none' ? undefined : v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Manual / Clássico</SelectItem>
                      <SelectItem value="generate_study">Gerar Resumo/Material</SelectItem>
                      <SelectItem value="generate_quiz">Gerar Quiz</SelectItem>
                      <SelectItem value="quiz_score">Acertar Questões no Quiz</SelectItem>
                      <SelectItem value="time_focused">Tempo Focado (Minutos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Requisito (Qtd. Acertos/Minutos)</Label>
                  <Input type="number" value={node.triggerRequirement || node.timeRequiredMinutes || 0} onChange={e => updateNode(node.id, 'triggerRequirement', parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="md:col-span-12">
                <Label>Objetivo / Mensagem</Label>
                <Input value={node.objective || ''} onChange={e => updateNode(node.id, 'objective', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [viewEditor, setViewEditor] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        {viewEditor ? (
          <AdminAchievementsEditor onBack={() => setViewEditor(false)} />
        ) : (
          <>
            <div className="flex items-center gap-4 mb-8">
               <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                 <ArrowLeft className="h-5 w-5" />
               </Button>
               <div className="flex items-center gap-2">
                 <Shield className="h-6 w-6 text-primary" />
                 <h1 className="text-2xl font-bold">Painel Administrativo</h1>
               </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
               <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/manage-users')}>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <BarChart3 className="h-5 w-5 text-primary" />
                     Analytics
                   </CardTitle>
                   <CardDescription>Veja estatísticas de uso da plataforma</CardDescription>
                 </CardHeader>
               </Card>

               <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/support-admin')}>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <MessageCircle className="h-5 w-5 text-primary" />
                     Suporte
                   </CardTitle>
                   <CardDescription>Responda mensagens dos usuários</CardDescription>
                 </CardHeader>
               </Card>

               <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/engine-notices')}>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <AlertTriangle className="h-5 w-5 text-primary" />
                     Aviso de Motores
                   </CardTitle>
                   <CardDescription>Gerencie status e avisos dos motores da IA</CardDescription>
                 </CardHeader>
               </Card>

               <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/update-notices')}>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Megaphone className="h-5 w-5 text-accent" />
                     Avisos de Atualizações
                   </CardTitle>
                   <CardDescription>Publique avisos chamativos sobre próximas atualizações</CardDescription>
                 </CardHeader>
               </Card>

               <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/platform-control')}>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Settings2 className="h-5 w-5 text-secondary" />
                     Controle da Plataforma
                   </CardTitle>
                   <CardDescription>Ative/desative funcionalidades, trilha, grupos e mais</CardDescription>
                 </CardHeader>
               </Card>

               <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setViewEditor(true)}>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Map className="h-5 w-5 text-primary" />
                     Editor da Trilha
                   </CardTitle>
                   <CardDescription>Crie, mova e edite as conquistas e desafios da plataforma</CardDescription>
                 </CardHeader>
               </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
