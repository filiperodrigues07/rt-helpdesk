import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { ResolveTicketDialog } from '@/components/tickets/ResolveTicketDialog';
import { CloseTicketDialog } from '@/components/tickets/CloseTicketDialog';
import { ReopenTicketDialog } from '@/components/tickets/ReopenTicketDialog';
import { useUpdateTicketStatus } from '@/hooks/useTicketMutations';
import { toast } from '@/hooks/use-toast';
import { NON_TERMINAL_STATUSES, STATUS_LABELS } from '@/utils/ticketLabels';
import type { TicketDetail, TicketStatus } from '@/types';

export function TicketStatusControl({ ticket }: { ticket: TicketDetail }) {
  const updateStatus = useUpdateTicketStatus();
  const [resolveOpen, setResolveOpen] = React.useState(false);
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [reopenOpen, setReopenOpen] = React.useState(false);

  function handleStatusChange(value: string) {
    updateStatus.mutate(
      { id: ticket.id, status: value as TicketStatus },
      { onError: () => toast({ variant: 'destructive', title: 'Erro ao alterar status' }) },
    );
  }

  if (ticket.status === 'RESOLVIDO' || ticket.status === 'ENCERRADO') {
    const dateLabel = ticket.status === 'RESOLVIDO' ? 'Resolvido em' : 'Encerrado em';
    const dateValue = ticket.status === 'RESOLVIDO' ? ticket.resolvedAt : ticket.closedAt;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <StatusBadge status={ticket.status} />
        </div>
        {dateValue && (
          <p className="text-xs text-muted-foreground">
            {dateLabel} {format(new Date(dateValue), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {ticket.status === 'RESOLVIDO' && (
            <Button type="button" onClick={() => setCloseOpen(true)}>
              Encerrar chamado
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => setReopenOpen(true)}>
            Reabrir chamado
          </Button>
        </div>

        <CloseTicketDialog ticketId={ticket.id} open={closeOpen} onOpenChange={setCloseOpen} />
        <ReopenTicketDialog ticketId={ticket.id} open={reopenOpen} onOpenChange={setReopenOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Select value={ticket.status} onValueChange={handleStatusChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {NON_TERMINAL_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="button" className="w-full" onClick={() => setResolveOpen(true)}>
        Marcar como Resolvido
      </Button>

      <ResolveTicketDialog ticketId={ticket.id} open={resolveOpen} onOpenChange={setResolveOpen} />
    </div>
  );
}
