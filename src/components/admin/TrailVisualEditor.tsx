import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { ArrowLeft, MousePointerClick, Move, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { availableIcons, createDraftTrailNode, sortTrailNodes, TrailNodeDef, useAchievementData } from '@/hooks/useAchievements';

const typeGradient: Record<string, string> = {
  challenge: 'from-primary to-secondary',
  quiz: 'from-secondary to-accent',
  milestone: 'from-accent to-primary',
  reward: 'from-primary to-accent',
  boss: 'from-destructive to-primary',
  secret: 'from-muted to-accent',
  event: 'from-secondary to-primary',
  legendary: 'from-accent to-secondary',
};

type DragState = {
  id: number;
  offsetX: number;
  offsetY: number;
} | null;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const buildPath = (from: TrailNodeDef, to: TrailNodeDef) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx1 = from.x + dx * 0.35;
  const cy1 = from.y + dy * 0.1;
  const cx2 = to.x - dx * 0.35;
  const cy2 = to.y - dy * 0.1;
  return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
};

const getCanvasPoint = (clientX: number, clientY: number, canvas: HTMLDivElement, scrollContainer: HTMLDivElement) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left + scrollContainer.scrollLeft,
    y: clientY - rect.top + scrollContainer.scrollTop,
  };
};

interface TrailVisualEditorProps {
  onBack: () => void;
}

const TrailVisualEditor = ({ onBack }: TrailVisualEditorProps) => {
  const { nodes, saveNodes } = useAchievementData();
  const { toast } = useToast();

  const [editingNodes, setEditingNodes] = useState<TrailNodeDef[]>(nodes);
  const [selectedId, setSelectedId] = useState<number | null>(nodes[0]?.id ?? null);
  const [isPlacingNode, setIsPlacingNode] = useState(false);
  const [dragState, setDragState] = useState<DragState>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditingNodes(nodes);
    setSelectedId((current) => current ?? nodes[0]?.id ?? null);
  }, [nodes]);

  const sortedNodes = useMemo(() => sortTrailNodes(editingNodes), [editingNodes]);
  const selectedNode = sortedNodes.find((node) => node.id === selectedId) ?? null;
  const canvasWidth = Math.max(...sortedNodes.map((node) => node.x), 0) + 280;
  const canvasHeight = Math.max(...sortedNodes.map((node) => node.y), 0) + 320;

  const updateNode = (id: number, patch: Partial<TrailNodeDef>) => {
    setEditingNodes((prev) => sortTrailNodes(prev.map((node) => (node.id === id ? { ...node, ...patch } : node))));
  };

  const removeNode = (id: number) => {
    setEditingNodes((prev) => {
      const next = prev
        .filter((node) => node.id !== id)
        .map((node) => ({ ...node, parents: node.parents.filter((parentId) => parentId !== id) }));
      return sortTrailNodes(next);
    });
    setSelectedId((current) => (current === id ? null : current));
  };

  const addNodeAtPosition = (x: number, y: number) => {
    const nextId = Math.max(0, ...sortedNodes.map((node) => node.id)) + 1;
    const parentId = sortedNodes[sortedNodes.length - 1]?.id;
    const newNode = createDraftTrailNode(nextId, Math.round(x), Math.round(y), parentId);
    const nextNodes = sortTrailNodes([...sortedNodes, newNode]);

    setEditingNodes(nextNodes);
    setSelectedId(newNode.id);
    setIsPlacingNode(false);
  };

  const handleCanvasClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isPlacingNode || !canvasRef.current || !scrollRef.current) return;
    const point = getCanvasPoint(event.clientX, event.clientY, canvasRef.current, scrollRef.current);
    addNodeAtPosition(point.x, point.y);
  };

  useEffect(() => {
    if (!dragState || !canvasRef.current || !scrollRef.current) return;

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      const point = getCanvasPoint(event.clientX, event.clientY, canvasRef.current!, scrollRef.current!);
      updateNode(dragState.id, {
        x: clamp(Math.round(point.x - dragState.offsetX), 60, canvasWidth - 120),
        y: clamp(Math.round(point.y - dragState.offsetY), 60, canvasHeight - 160),
      });
    };

    const handlePointerUp = () => setDragState(null);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, canvasHeight, canvasWidth]);

  const handleSave = () => {
    saveNodes(sortedNodes);
    toast({ title: 'Trilha salva', description: 'As alterações visuais da trilha foram atualizadas.' });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Editor Visual da Trilha</h1>
            <p className="text-sm text-muted-foreground">Clique e arraste os desafios no mapa. Para criar um novo, clique em adicionar e depois no caminho visual.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={isPlacingNode ? 'default' : 'outline'} onClick={() => setIsPlacingNode((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" /> {isPlacingNode ? 'Cancelar' : 'Adicionar desafio'}
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Salvar trilha
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Move className="h-4 w-4 text-primary" /> Mapa da trilha
            </CardTitle>
            <CardDescription>
              {isPlacingNode ? 'Clique em qualquer ponto do mapa para criar um novo desafio.' : 'Selecione um desafio para editar e arraste o círculo para reposicionar.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div ref={scrollRef} className="relative min-h-[72vh] overflow-auto bg-muted/20">
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                className={`relative ${isPlacingNode ? 'cursor-crosshair' : ''}`}
                style={{ width: canvasWidth, height: canvasHeight, minWidth: '100%' }}
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    opacity: 0.24,
                  }}
                />

                <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ width: canvasWidth, height: canvasHeight }}>
                  {sortedNodes.map((node) =>
                    node.parents.map((parentId) => {
                      const parent = sortedNodes.find((item) => item.id === parentId);
                      if (!parent) return null;
                      const path = buildPath(parent, node);
                      return (
                        <g key={`${parent.id}-${node.id}`}>
                          <path d={path} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={34} className="stroke-border/90" />
                          <path d={path} fill="none" strokeLinecap="round" strokeWidth={3} strokeDasharray="12,10" className="stroke-muted-foreground/20" />
                        </g>
                      );
                    }),
                  )}
                </svg>

                {sortedNodes.map((node) => {
                  const Icon = availableIcons[node.iconName] || availableIcons.Star;
                  const isSelected = node.id === selectedId;

                  return (
                    <div key={node.id} className="absolute" style={{ left: node.x, top: node.y }}>
                      <button
                        type="button"
                        className="relative -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(node.id);
                        }}
                        onPointerDown={(event) => {
                          if (isPlacingNode) return;
                          event.stopPropagation();
                          setSelectedId(node.id);
                          const rect = event.currentTarget.getBoundingClientRect();
                          setDragState({
                            id: node.id,
                            offsetX: event.clientX - rect.left - rect.width / 2,
                            offsetY: event.clientY - rect.top - rect.height / 2,
                          });
                        }}
                      >
                        <div
                          className={`relative flex h-14 w-14 items-center justify-center rounded-full border-[3px] bg-gradient-to-br ${typeGradient[node.type]} text-primary-foreground shadow-lg transition-all duration-200 ${
                            isSelected ? 'ring-4 ring-primary/25' : 'ring-0'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="absolute left-1/2 top-full mt-2 flex w-36 -translate-x-1/2 flex-col items-center gap-1 text-center">
                          <span className={`rounded-md px-2 py-1 text-[10px] font-semibold leading-tight shadow-sm ring-1 backdrop-blur-sm ${isSelected ? 'bg-background text-foreground ring-primary/40' : 'bg-background/90 text-foreground ring-border/60'}`}>
                            {node.title}
                          </span>
                          <Badge variant="outline" className="h-5 px-2 text-[10px]">#{node.id}</Badge>
                        </div>
                      </button>
                    </div>
                  );
                })}

                {isPlacingNode && (
                  <div className="absolute right-4 top-4 rounded-full border border-primary/30 bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                    <MousePointerClick className="mr-1 inline h-3.5 w-3.5 text-primary" /> clique no mapa para criar
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle>{selectedNode ? `Editar desafio #${selectedNode.id}` : 'Selecione um desafio'}</CardTitle>
            <CardDescription>
              {selectedNode ? 'A descrição, ligação e recompensa são alteradas aqui e refletem no mapa visual.' : 'Clique em um desafio no mapa para editar.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {selectedNode ? (
              <>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={selectedNode.title} onChange={(event) => updateNode(selectedNode.id, { title: event.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Descrição do desafio</Label>
                  <Textarea value={selectedNode.objective || ''} onChange={(event) => updateNode(selectedNode.id, { objective: event.target.value })} className="min-h-[110px]" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <Label>Tipo visual</Label>
                    <Select value={selectedNode.type} onValueChange={(value) => updateNode(selectedNode.id, { type: value as TrailNodeDef['type'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="challenge">Desafio</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="milestone">Marco</SelectItem>
                        <SelectItem value="reward">Recompensa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <Select value={selectedNode.iconName} onValueChange={(value) => updateNode(selectedNode.id, { iconName: value as keyof typeof availableIcons })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(availableIcons).map((icon) => (
                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <Label>Recompensa em créditos</Label>
                    <Input
                      type="number"
                      min={0}
                      value={selectedNode.creditReward}
                      onChange={(event) => updateNode(selectedNode.id, { creditReward: Number(event.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Depende de qual desafio?</Label>
                    <Select
                      value={selectedNode.parents[0] ? String(selectedNode.parents[0]) : 'none'}
                      onValueChange={(value) => updateNode(selectedNode.id, { parents: value === 'none' ? [] : [Number(value)] })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem dependência</SelectItem>
                        {sortedNodes.filter((node) => node.id !== selectedNode.id).map((node) => (
                          <SelectItem key={node.id} value={String(node.id)}>
                            #{node.id} — {node.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Como desbloqueia?</Label>
                  <Select
                    value={selectedNode.triggerType || 'none'}
                    onValueChange={(value) => updateNode(selectedNode.id, { triggerType: value as TrailNodeDef['triggerType'] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Manual / clássico</SelectItem>
                      <SelectItem value="generate_study">Gerar material</SelectItem>
                      <SelectItem value="generate_quiz">Gerar exercícios</SelectItem>
                      <SelectItem value="quiz_score">Acertar exercícios</SelectItem>
                      <SelectItem value="time_focused">Tempo focado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade / requisito</Label>
                  <Input
                    type="number"
                    min={0}
                    value={selectedNode.triggerRequirement || 0}
                    onChange={(event) => updateNode(selectedNode.id, { triggerRequirement: Number(event.target.value) || 0 })}
                  />
                </div>

                <Button variant="destructive" className="w-full" onClick={() => removeNode(selectedNode.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir desafio
                </Button>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Selecione um desafio no mapa ou clique em <strong>Adicionar desafio</strong> para criar um novo diretamente na trilha visual.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrailVisualEditor;
