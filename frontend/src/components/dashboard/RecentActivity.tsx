import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Circle } from 'lucide-react';
import type { DashboardSummary } from '@/types';

interface RecentActivityProps {
  items: DashboardSummary['recentActivity'];
}

const ACTION_LABELS: Record<string, string> = {
  CHAMADO_CRIADO: 'criou o chamado',
  RESPONSAVEL_ATRIBUIDO: 'atribuiu o responsável do chamado',
  CHAMADO_RESOLVIDO: 'resolveu o chamado',
  CHAMADO_ENCERRADO: 'encerrou o chamado',
};

export function RecentActivity({ items }: RecentActivityProps) {
  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Nenhuma atividade recente.
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3">
          <div className="mt-1 flex flex-col items-center">
            <Circle className="h-2 w-2 fill-primary text-primary" />
            <div className="mt-1 w-px flex-1 bg-border" />
          </div>
          <div className="min-w-0 pb-1">
            <p className="text-sm leading-snug">
              <span className="font-medium">{item.author?.name ?? 'Sistema'}</span>{' '}
              <span className="text-muted-foreground">{ACTION_LABELS[item.action] ?? item.action.toLowerCase()}</span>{' '}
              {item.ticket && (
                <span className="font-medium text-primary">
                  #{item.ticket.number} {item.ticket.title}
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
