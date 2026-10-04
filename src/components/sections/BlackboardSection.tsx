import { useTranslation } from 'react-i18next';
import { ArrowDown, BookOpen, MoveDown, RefreshCw } from 'lucide-react';
import type { StudyContent } from '@/types/study';

type Blackboard = NonNullable<StudyContent['quadroNegro']>;
type Step = StudyContent['demonstracoes']['passos'][number];

interface Props {
  data?: Blackboard;
  steps?: Step[];
  summary?: StudyContent['resumo'];
  objective?: StudyContent['objetivo'];
  tema: string;
}

/** The board uses the actual lesson's reasoning; it never invents calculations. */
export function BlackboardSection({ data, steps, summary, objective, tema }: Props) {
  const { t } = useTranslation();
  const generated = Array.isArray(data?.linhas) ? data.linhas.filter(line => typeof line?.texto === 'string' && line.texto.trim()).slice(0, 7) : [];
  const fallbackSteps = Array.isArray(steps) ? steps.slice(0, 5).map(step => ({
    titulo: step.titulo,
    texto: [step.conceito?.trim(), step.exemplo?.trim()].filter(Boolean).join('\n'),
  })).filter(line => line.texto) : [];
  const lines = generated.length ? generated : fallbackSteps.length ? fallbackSteps : [
    { titulo: objective?.titulo, texto: objective?.conteudo || '' },
    { titulo: summary?.titulo, texto: summary?.conteudo || '' },
  ].filter(line => line.texto.trim());

  const schemeNodes = Array.isArray(data?.esquema?.nos)
    ? data.esquema.nos.filter(node => typeof node?.rotulo === 'string' && node.rotulo.trim()).slice(0, 5)
    : [];
  const schemeType = data?.esquema?.tipo;
  const visualNodes = schemeNodes.length >= 2 ? schemeNodes : lines.slice(0, 4).map(line => ({ rotulo: line.titulo || line.texto.split(/[.!?\n]/)[0].slice(0, 48) }));

  if (!lines?.length) return null;

  return (
    <section className="space-y-3" aria-label={data?.titulo || t('sections.steps')}>
      <div className="flex items-center gap-2 text-secondary">
        <BookOpen className="h-5 w-5" aria-hidden="true" />
        <h3 className="font-display text-xl font-bold text-foreground">{data?.titulo || t('sections.steps')}</h3>
      </div>
      <div className="chalkboard relative isolate overflow-hidden rounded-xl border-[4px] border-board-frame p-4 sm:p-8 md:p-10">
        <div className="relative z-10 mb-7 border-b border-board-chalk/25 pb-4">
          <span className="text-xs font-bold uppercase text-board-soft">{t('result.topic')}</span>
          <h4 className="mt-1 break-words font-display text-xl font-bold text-board-chalk sm:text-2xl">{tema}</h4>
        </div>
        {visualNodes.length >= 2 && (
          <div className="relative z-10 mb-8 rounded-lg border border-board-soft/40 p-4 sm:p-5" aria-label={data?.titulo || t('sections.steps')}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))] sm:items-stretch">
              {visualNodes.map((node, index) => (
                <div key={index} className="relative flex min-w-0 flex-col items-center gap-2 text-center">
                  <div className="flex w-full flex-1 flex-col justify-center rounded-md border border-board-soft/60 bg-board-chalk/5 px-3 py-3">
                    <span className="mb-1 text-xs font-bold text-board-accent">{String(index + 1).padStart(2, '0')}</span>
                    <span className="break-words text-sm font-semibold text-board-chalk">{node.rotulo}</span>
                    {node.detalhe && <span className="mt-1 break-words text-xs leading-5 text-board-soft">{node.detalhe}</span>}
                  </div>
                  {index < visualNodes.length - 1 && <ArrowDown className="h-4 w-4 text-board-accent sm:absolute sm:-right-3 sm:top-1/2 sm:z-10 sm:-translate-y-1/2 sm:rotate-[-90deg]" aria-hidden="true" />}
                </div>
              ))}
            </div>
            {schemeType === 'ciclo' && <RefreshCw className="mx-auto mt-3 h-4 w-4 text-board-soft" aria-hidden="true" />}
          </div>
        )}
        <ol className="relative z-10 space-y-6">
          {lines.map((line, index) => (
            <li key={`${index}-${line.titulo}`} className="min-w-0">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-board-soft/60 text-sm font-bold text-board-soft">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  {line.titulo && <h5 className="mb-2 font-display text-base font-bold text-board-accent sm:text-lg">{line.titulo}</h5>}
                  <p className="whitespace-pre-line break-words [overflow-wrap:anywhere] font-sans text-sm leading-7 text-board-chalk sm:text-base sm:leading-8">{line.texto}</p>
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