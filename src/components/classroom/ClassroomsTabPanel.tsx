import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GraduationCap, Loader2, Plus } from 'lucide-react';
import { useTeacherClassrooms } from '@/hooks/useClassroom';

const prefetchClassroom = () => { void import('@/pages/Classroom'); };

/** Compact classroom list shown inside the Study Groups sheet. */
export function ClassroomsTabPanel({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classrooms, loading } = useTeacherClassrooms();

  // Baixa o código da página assim que a aba abre, para o clique ser instantâneo.
  useEffect(() => { prefetchClassroom(); }, []);

  const go = (path: string) => {
    onNavigate?.();
    navigate(path);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-4">
        <Button className="w-full gap-2" onMouseEnter={prefetchClassroom} onClick={() => go('/classroom')}>
          <Plus className="h-4 w-4" />
          {t('classroom.manage', 'Gerenciar salas de aula')}
        </Button>

        <p className="text-xs text-muted-foreground mt-2">
          {t('classroom.tabHint', 'Crie turmas com chave de acesso. Seus alunos entram sem precisar de conta.')}
        </p>
      </div>
      <ScrollArea className="flex-1 px-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : classrooms.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('classroom.empty', 'Você ainda não tem salas de aula.')}</p>
        ) : (
          <div className="space-y-2 pb-4">
            {classrooms.map((c) => (
              <button
                key={c.id}
                onClick={() => go('/classroom')}
                className="w-full text-left p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    {c.name}
                  </h3>
                  <Badge variant={c.is_open ? 'default' : 'secondary'} className="text-xs">
                    {c.is_open ? t('classroom.open', 'Aberta') : t('classroom.closed', 'Fechada')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {c.subject ? `${c.subject} · ` : ''}{t('classroom.key', 'Chave')}: {c.join_key}
                </p>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
