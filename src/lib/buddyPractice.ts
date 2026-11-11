export type BuddyTool = 'flashcards' | 'summary' | 'quiz' | 'map' | 'review';
export interface BuddyCard { front: string; back: string; emoji?: string; tag?: string; tip?: string }
export interface BuddyQuestion { question: string; options: string[]; correctIndex: number; explanation?: string }
export interface BuddyMaterial {
  cards?: BuddyCard[];
  title?: string;
  bullets?: string[];
  keyTerms?: { term: string; definition: string }[];
  conclusion?: string;
  questions?: BuddyQuestion[];
  branches?: { title: string; points: string[]; example: string }[];
  days?: { day: number; goal: string; tasks: string[]; check: string }[];
}
export interface SavedBuddyMaterial { id: string; topic: string; tool: BuddyTool; data: BuddyMaterial; createdAt: string }
export function quizScore(questions: BuddyQuestion[], answers: Record<number, number>) {
  return questions.reduce((score, q, i) => score + (answers[i] === q.correctIndex ? 1 : 0), 0);
}
export function missedQuestions(questions: BuddyQuestion[], answers: Record<number, number>) {
  return questions.filter((q, i) => answers[i] !== undefined && answers[i] !== q.correctIndex);
}
export function recordAnswer(answers: Record<number, number>, index: number, choice: number) {
  return answers[index] === undefined ? { ...answers, [index]: choice } : answers;
}
export function reviewCardIndexes(cards: BuddyCard[], mastered: Record<number, boolean>, onlyReview: boolean) {
  return cards.map((_, i) => i).filter(i => !onlyReview || !mastered[i]);
}
export function materialText(topic: string, data: BuddyMaterial) {
  const sections = [topic, data.title ?? '', ...(data.bullets ?? []),
    ...(data.keyTerms ?? []).map(k => `${k.term}: ${k.definition}`),
    ...(data.cards ?? []).map((c, i) => `${i + 1}. ${c.front}\n${c.back}\n${c.tip ?? ''}`),
    ...(data.questions ?? []).map((q, i) => `${i + 1}. ${q.question}\n${q.options.join('\n')}\n✓ ${q.options[q.correctIndex]}\n${q.explanation ?? ''}`),
    ...(data.branches ?? []).map(b => `${b.title}\n${b.points.join('\n')}\n${b.example}`),
    ...(data.days ?? []).map(d => `${d.day}. ${d.goal}\n${d.tasks.join('\n')}\n${d.check}`), data.conclusion ?? ''];
  return sections.filter(Boolean).join('\n\n');
}