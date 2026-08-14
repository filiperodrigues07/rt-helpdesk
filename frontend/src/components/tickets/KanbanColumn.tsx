import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/utils/cn';
import { TicketCard } from './TicketCard';
import type { TicketListItem, TicketStatus } from '@/types';
import { STATUS_LABELS } from '@/utils/ticketLabels';

interface KanbanColumnProps {
  status: TicketStatus;
  tickets: TicketListItem[];
}

export function KanbanColumn({ status, tickets }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/20">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-medium">{STATUS_LABELS[status]}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tickets.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors',
          isOver && 'bg-primary/5',
        )}
        style={{ minHeight: 200, maxHeight: 'calc(100vh - 320px)' }}
      >
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
        {tickets.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">Nenhum chamado</p>
        )}
      </div>
    </div>
  );
}
