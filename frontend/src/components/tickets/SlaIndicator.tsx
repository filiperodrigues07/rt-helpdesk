import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/utils/cn';
import type { TicketStatus } from '@/types';
import { TERMINAL_STATUSES } from '@/utils/ticketLabels';

interface SlaIndicatorProps {
  slaDueAt: string | null;
  status: TicketStatus;
  className?: string;
}

// Espelha SLA_RISK_WINDOW_MIN em backend/src/services/dashboardService.ts (badge "at risk" no dashboard).
const AT_RISK_WINDOW_MIN = 240;

export function SlaIndicator({ slaDueAt, status, className }: SlaIndicatorProps) {
  if (TERMINAL_STATUSES.includes(status)) {
    return <span className={cn('text-xs text-muted-foreground', className)}>Finalizado</span>;
  }

  if (!slaDueAt) {
    return <span className={cn('text-xs text-muted-foreground', className)}>—</span>;
  }

  const due = new Date(slaDueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const isAtRisk = !isOverdue && diffMs < AT_RISK_WINDOW_MIN * 60 * 1000;

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
