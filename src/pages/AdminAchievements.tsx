import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Save, Loader2, Map } from 'lucide-react';
import { useAchievementData, availableIcons, TrailNodeDef, IconName } from '@/hooks/useAchievements';

const AdminAchievements = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const { nodes, saveNodes } = useAchievementData();
  const [editNodes, setEditNodes] = useState<TrailNodeDef[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => {
    setEditNodes(JSON.parse(JSON.stringify(nodes)));
  }, [nodes]);

  const handleSave = () => {
    saveNodes(editNodes);
    toast({ title: 'Trilha salva!', description: 'As alterações foram persistidas.' });
  };

  const addNode = () => {
    const maxId = editNodes.reduce((max, n) => Math.max(max, n.id), 0);
    const newNode: TrailNodeDef = {
      id: maxId + 1,
      title: `Novo Nó ${maxId + 1}`,
      description: 'Descrição do desafio aqui.',
      type: 'challenge',
      creditReward: 1,
      iconName: 'Star',
      x: 100,
      y: 150,
      parents: [],
    };
    setEditNodes([...editNodes, newNode]);
  };

  const removeNode = (id: number) => {
    setEditNodes(editNodes.filter(n => n.id !== id).map(n => ({
      ...n,
      parents: n.parents.filter(p => p !== id),
    })));
  };

  const updateNode = (id: number, field: string, value: any) => {
    setEditNodes(editNodes.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

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
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Map className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Editor da Trilha</h1>
        </div>

        <div className="flex gap-2 mb-4">
          <Button onClick={addNode} size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar Nó</Button>
          <Button onClick={handleSave} size="sm" variant="default"><Save className="h-4 w-4 mr-1" /> Salvar</Button>
        </div>

        <div className="space-y-3">
          {editNodes.map(node => (
            <Card key={node.id} className="border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">ID: {node.id}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeNode(node.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Título</Label>
                    <Input value={node.title} onChange={e => updateNode(node.id, 'title', e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={node.type} onValueChange={v => updateNode(node.id, 'type', v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="challenge">Desafio</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="milestone">Marco</SelectItem>
                        <SelectItem value="reward">Recompensa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Créditos</Label>
                    <Input type="number" value={node.creditReward} onChange={e => updateNode(node.id, 'creditReward', parseInt(e.target.value) || 0)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Ícone</Label>
                    <Select value={node.iconName} onValueChange={v => updateNode(node.id, 'iconName', v as IconName)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(availableIcons).map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">X</Label>
                    <Input type="number" value={node.x} onChange={e => updateNode(node.id, 'x', parseInt(e.target.value) || 0)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Y</Label>
                    <Input type="number" value={node.y} onChange={e => updateNode(node.id, 'y', parseInt(e.target.value) || 0)} className="h-8 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Pais (IDs separados por vírgula)</Label>
                    <Input value={node.parents.join(',')} onChange={e => updateNode(node.id, 'parents', e.target.value.split(',').map(Number).filter(n => !isNaN(n) && n > 0))} className="h-8 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Objetivo</Label>
                    <Input value={node.objective || ''} onChange={e => updateNode(node.id, 'objective', e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Trigger</Label>
                    <Select value={node.triggerType || 'none'} onValueChange={v => updateNode(node.id, 'triggerType', v === 'none' ? undefined : v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        <SelectItem value="generate_study">Gerar Estudo</SelectItem>
                        <SelectItem value="generate_quiz">Gerar Quiz</SelectItem>
                        <SelectItem value="quiz_score">Nota no Quiz</SelectItem>
                        <SelectItem value="time_focused">Tempo Focado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Requisito (min)</Label>
                    <Input type="number" value={node.triggerRequirement || node.timeRequiredMinutes || ''} onChange={e => {
                      const val = parseInt(e.target.value) || undefined;
                      updateNode(node.id, 'triggerRequirement', val);
                      if (node.triggerType === 'time_focused') updateNode(node.id, 'timeRequiredMinutes', val);
                    }} className="h-8 text-sm" />
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

export default AdminAchievements;
