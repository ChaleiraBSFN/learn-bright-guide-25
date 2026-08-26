import type { ClassroomMaterial } from '@/hooks/useClassroom';
import type { Exercise } from '@/types/exercises';

export interface MaterialPart {
  title: string;
  kind: 'study' | 'exercise';
  /** Partial study content to render (study parts) */
  content?: any;
  /** Single exercise (exercise parts) */
  exercise?: Exercise;
}

/**
 * Splits a classroom material into presentable parts.
 * Study content -> objective, each step/concept, summary, each study-plan day,
 * common mistakes, mind map, exercises.
 * Exercises -> one part per question.
 */
export function getMaterialParts(material: ClassroomMaterial | null | undefined): MaterialPart[] {
  if (!material) return [];

  if (material.type === 'exercises') {
    const list: Exercise[] = material.content?.exercicios || [];
    return list.map((ex: any, i: number) => ({
      title: `Questão ${ex?.numero ?? i + 1}`,
      kind: 'exercise' as const,
      exercise: ex,
    }));
  }

  const c: any = material.content || {};
  const parts: MaterialPart[] = [];

  if (c.objetivo) parts.push({ title: c.objetivo.titulo || 'Objetivo', kind: 'study', content: { objetivo: c.objetivo } });

  if (c.demonstracoes?.passos?.length) {
    c.demonstracoes.passos.forEach((p: any, i: number) => {
      parts.push({
        title: p.titulo ? `Conceito ${i + 1}: ${p.titulo}` : `Conceito ${i + 1}`,
        kind: 'study',
        content: { demonstracoes: { titulo: c.demonstracoes.titulo, passos: [p] } },
      });
    });
  }

  if (c.resumo) parts.push({ title: c.resumo.titulo || 'Resumo', kind: 'study', content: { resumo: c.resumo } });

  if (c.mapaVisual) parts.push({ title: c.mapaVisual.titulo || 'Mapa visual', kind: 'study', content: { mapaVisual: c.mapaVisual } });

  if (c.errosComuns) parts.push({ title: c.errosComuns.titulo || 'Erros comuns', kind: 'study', content: { errosComuns: c.errosComuns } });

  if (c.planoEstudo?.blocos?.length) {
    c.planoEstudo.blocos.forEach((b: any, i: number) => {
      parts.push({
        title: b.periodo ? `Roteiro — ${b.periodo}` : `Roteiro — Dia ${i + 1}`,
        kind: 'study',
        content: { planoEstudo: { titulo: c.planoEstudo.titulo, blocos: [b] } },
      });
    });
  }

  if (c.exercicios?.lista?.length) {
    c.exercicios.lista.forEach((ex: any, i: number) => {
      parts.push({
        title: `Prática ${i + 1}`,
        kind: 'study',
        content: { exercicios: { titulo: c.exercicios.titulo, lista: [ex] } },
      });
    });
  }

  if (c.fontes) parts.push({ title: c.fontes.titulo || 'Fontes', kind: 'study', content: { fontes: c.fontes } });

  // Fallback: nothing recognizable -> show whole content as a single part
  if (parts.length === 0) parts.push({ title: material.title, kind: 'study', content: c });

  return parts;
}
