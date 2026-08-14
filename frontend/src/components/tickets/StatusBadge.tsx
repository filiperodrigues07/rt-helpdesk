import { Badge } from '@/components/ui/badge';
import type { TicketStatus } from '@/types';
import { STATUS_LABELS } from '@/utils/ticketLabels';

const STATUS_VARIANTS: Record<TicketStatus, 'default' | 'secondary' | 'outline' | 'success'> = {
  NOVO: 'outline',
  EM_ANDAMENTO: 'default',
  AGUARDANDO_CLIENTE: 'secondary',
  AGUARDANDO_TERCEIRO: 'secondary',
  RESOLVIDO: 'success',
  ENCERRADO: 'outline',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
