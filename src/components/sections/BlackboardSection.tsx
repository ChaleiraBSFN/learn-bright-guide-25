import { useTranslation } from 'react-i18next';
import { BookOpen, MoveDown } from 'lucide-react';
import type { StudyContent } from '@/types/study';

type Blackboard = NonNullable<StudyContent['quadroNegro']>;
type Step = StudyContent['demonstracoes']['passos'][number];

interface Props {
  data?: Blackboard;
  steps?: Step[];
  tema: string;
}

/** The board uses the actual lesson's reasoning; it never invents calculations. */
export function BlackboardSection({ data, steps, tema }: Props) {
  const { t } = useTranslation();
  const generated = data?.linhas?.filter(line => line?.texto?.trim()).slice(0, 6);
  const lines = generated?.length ? generated : steps?.slice(0, 4).map(step => ({
    titulo: step.titulo,
    texto: step.exemplo?.trim() || step.conceito?.trim() || '',
  })).filter(line => line.texto);

  if (!lines?.length) return null;

  return (
    <section className="space-y-3" aria-label={data?.titulo || t('sections.steps')}>
      <div className="flex items-center gap-2 text-secondary">
        <BookOpen className="h-5 w-5" aria-hidden="true" />
        <h3 className="font-display text-xl font-bold text-foreground">{data?.titulo || t('sections.steps')}</h3>
      </div>
      <div className="chalkboard relative isolate overflow-hidden rounded-xl border-[5px] border-board-frame p-5 sm:p-8 md:p-10 shadow-xl">
        <div className="relative z-10 mb-7 border-b border-board-chalk/25 pb-4">
          <span className="text-xs font-bold uppercase text-board-soft">{t('result.topic')}</span>
          <h4 className="mt-1 break-words font-display text-xl font-bold text-board-chalk sm:text-2xl">{tema}</h4>
        </div>
        <ol className="relative z-10 space-y-6">
          {lines.map((line, index) => (
            <li key={`${index}-${line.titulo}`} className="min-w-0">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-board-soft/60 text-sm font-bold text-board-soft">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  {line.titulo && <h5 className="mb-2 font-display text-base font-bold text-board-accent sm:text-lg">{line.titulo}</h5>}
                  <p className="whitespace-pre-line break-words font-mono text-sm leading-7 text-board-chalk sm:text-base sm:leading-8">{line.texto}</p>
                </div>
              </div>
              {index < lines.length - 1 && <MoveDown className="ml-2 mt-4 h-4 w-4 text-board-soft" aria-hidden="true" />}
            </li>
          ))}
        </ol>
        {data?.conclusao && <p className="relative z-10 mt-8 border-t border-board-chalk/25 pt-5 font-display text-base font-bold text-board-accent sm:text-lg">{data.conclusao}</p>}
      </div>
    </section>
  );
}