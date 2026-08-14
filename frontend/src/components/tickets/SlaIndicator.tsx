import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/utils/cn';
import type { TicketStatus } from '@/types';

interface SlaIndicatorProps {
  slaDueAt: string | null;
  status: TicketStatus;
  className?: string;
}

const FINISHED_STATUSES: TicketStatus[] = ['RESOLVIDO', 'ENCERRADO'];

export function SlaIndicator({ slaDueAt, status, className }: SlaIndicatorProps) {
  if (FINISHED_STATUSES.includes(status)) {
    return <span className={cn('text-xs text-muted-foreground', className)}>Finalizado</span>;
  }

  if (!slaDueAt) {
    return <span className={cn('text-xs text-muted-foreground', className)}>—</span>;
  }

  const due = new Date(slaDueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const isAtRisk = !isOverdue && diffMs < 4 * 60 * 60 * 1000;

  const distance = formatDistanceToNowStrict(due, { locale: ptBR });

  return (
    <span
      className={cn(
        'text-xs font-medium',
        isOverdue && 'text-destructive',
        isAtRisk && 'text-warning',
        !isOverdue && !isAtRisk && 'text-muted-foreground',
        className,
      )}
    >
      {isOverdue ? `Vencido há ${distance}` : `Vence em ${distance}`}
    </span>
  );
}
