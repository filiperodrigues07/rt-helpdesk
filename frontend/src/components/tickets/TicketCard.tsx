import { useNavigate } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PriorityBadge } from './PriorityBadge';
import { SlaIndicator } from './SlaIndicator';
import type { TicketListItem } from '@/types';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function TicketCard({ ticket }: { ticket: TicketListItem }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-pointer touch-none select-none hover:border-primary/40"
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && navigate(`/chamados/${ticket.id}`)}
    >
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">#{ticket.number}</span>
          <PriorityBadge priority={ticket.priority} />
        </div>
        <p className="line-clamp-2 text-sm font-medium leading-snug">{ticket.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {ticket.customer.tradeName ?? ticket.customer.companyName}
        </p>
        <div className="flex items-center justify-between pt-1">
          <SlaIndicator slaDueAt={ticket.slaDueAt} status={ticket.status} />
          {ticket.assignee ? (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">{initials(ticket.assignee.name)}</AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
