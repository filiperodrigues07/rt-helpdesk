import * as React from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { ResolveTicketDialog } from './ResolveTicketDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useUpdateTicketStatus } from '@/hooks/useTicketMutations';
import { toast } from '@/hooks/use-toast';
import type { TicketListItem, TicketStatus } from '@/types';

const COLUMNS: TicketStatus[] = [
  'NOVO',
  'EM_ANDAMENTO',
  'AGUARDANDO_CLIENTE',
  'AGUARDANDO_TERCEIRO',
  'RESOLVIDO',
  'ENCERRADO',
];

const RESOLUTION_STATUSES: TicketStatus[] = ['RESOLVIDO', 'ENCERRADO'];

interface TicketsKanbanProps {
  tickets: TicketListItem[] | undefined;
  isLoading: boolean;
}

export function TicketsKanban({ tickets, isLoading }: TicketsKanbanProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const updateStatus = useUpdateTicketStatus();

  const [resolveTarget, setResolveTarget] = React.useState<{
    ticketId: string;
    status: 'RESOLVIDO' | 'ENCERRADO';
  } | null>(null);

  const grouped = React.useMemo(() => {
    const map = new Map<TicketStatus, TicketListItem[]>(COLUMNS.map((status) => [status, []]));
    tickets?.forEach((ticket) => {
      map.get(ticket.status)?.push(ticket);
    });
    return map;
  }, [tickets]);

  function handleDragEnd(event: DragEndEvent) {
    const ticketId = event.active.id as string;
    const targetStatus = event.over?.id as TicketStatus | undefined;
    if (!targetStatus) return;

    const ticket = tickets?.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === targetStatus) return;

    if (RESOLUTION_STATUSES.includes(targetStatus)) {
      setResolveTarget({ ticketId, status: targetStatus as 'RESOLVIDO' | 'ENCERRADO' });
      return;
    }

    updateStatus.mutate(
      { id: ticketId, status: targetStatus },
      {
        onError: () =>
          toast({ variant: 'destructive', title: 'Erro ao mover chamado', description: 'Tente novamente.' }),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto">
        {COLUMNS.map((status) => (
          <Skeleton key={status} className="h-96 w-72 shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {COLUMNS.map((status) => (
            <KanbanColumn key={status} status={status} tickets={grouped.get(status) ?? []} />
          ))}
        </div>
      </DndContext>

      {resolveTarget && (
        <ResolveTicketDialog
          ticketId={resolveTarget.ticketId}
          status={resolveTarget.status}
          open={!!resolveTarget}
          onOpenChange={(open) => !open && setResolveTarget(null)}
        />
      )}
    </>
  );
}
