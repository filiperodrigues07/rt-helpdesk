import { Badge } from '@/components/ui/badge';
import type { TicketPriority } from '@/types';
import { PRIORITY_LABELS } from '@/utils/ticketLabels';

const PRIORITY_VARIANTS: Record<TicketPriority, 'secondary' | 'default' | 'warning' | 'destructive'> = {
  BAIXA: 'secondary',
  NORMAL: 'default',
  ALTA: 'warning',
  CRITICA: 'destructive',
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge variant={PRIORITY_VARIANTS[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}
