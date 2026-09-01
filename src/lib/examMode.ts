export interface ExamModeState {
  /** Chave da matéria (ex.: "math") ou texto livre. */
  materia?: string;
  /** Tema estudado. */
  tema?: string;
  /** Data da prova em ISO (YYYY-MM-DD). */
  dataProva: string;
  /** Nota alvo (0-10). */
  notaAlvo?: number;
}

const KEY = "lb_exam_mode";
export const EXAM_MODE_EVENT = "lb-exam-mode-change";

export function getExamMode(): ExamModeState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExamModeState;
    if (!parsed?.dataProva) return null;
    if (daysUntil(parsed.dataProva) < 0) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setExamMode(state: ExamModeState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EXAM_MODE_EVENT));
  } catch {
    /* armazenamento indisponível — o modo prova só não persiste */
  }
}

export function clearExamMode() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EXAM_MODE_EVENT));
  } catch {
    /* ignore */
  }
}

/** Dias inteiros entre hoje e a data informada. Negativo quando já passou. */
export function daysUntil(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return -1;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
