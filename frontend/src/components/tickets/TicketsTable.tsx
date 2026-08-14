import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SlaIndicator } from './SlaIndicator';
import type { PaginatedResult, TicketListFilters, TicketListItem } from '@/types';
import { cn } from '@/utils/cn';

interface TicketsTableProps {
  data: PaginatedResult<TicketListItem> | undefined;
  isLoading: boolean;
  filters: TicketListFilters;
  onFiltersChange: (filters: TicketListFilters) => void;
}

const COLUMNS: { key: TicketListFilters['sortBy']; label: string }[] = [
  { key: 'number', label: 'Número' },
  { key: undefined, label: 'Título' },
  { key: undefined, label: 'Cliente' },
  { key: undefined, label: 'Responsável' },
  { key: 'priority', label: 'Prioridade' },
  { key: undefined, label: 'Status' },
  { key: 'slaDueAt', label: 'SLA' },
  { key: 'updatedAt', label: 'Atualização' },
];

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function TicketsTable({ data, isLoading, filters, onFiltersChange }: TicketsTableProps) {
  const navigate = useNavigate();

  function toggleSort(key: TicketListFilters['sortBy']) {
    if (!key) return;
    if (filters.sortBy === key) {
      onFiltersChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      onFiltersChange({ ...filters, sortBy: key, sortOrder: 'desc' });
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.label} className="whitespace-nowrap px-4 py-2 font-medium">
                  {column.key ? (
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort(column.key)}
                    >
                      {column.label}
                      {filters.sortBy === column.key &&
                        (filters.sortOrder === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        ))}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  <td className="px-4 py-3" colSpan={8}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <Inbox className="mx-auto mb-2 h-6 w-6" />
                  Nenhum chamado encontrado com os filtros atuais.
                </td>
              </tr>
            )}

            {!isLoading &&
              data?.items.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={cn(
                    'cursor-pointer border-b border-border last:border-0 hover:bg-accent/50',
                  )}
                  onClick={() => navigate(`/chamados/${ticket.id}`)}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">
                    #{ticket.number}
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate font-medium">{ticket.title}</p>
                  </td>
                  <td className="max-w-[160px] px-4 py-3">
                    <p className="truncate text-muted-foreground">
                      {ticket.customer.tradeName ?? ticket.customer.companyName}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {ticket.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">{initials(ticket.assignee.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">{ticket.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Não atribuído</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <SlaIndicator slaDueAt={ticket.slaDueAt} status={ticket.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true, locale: ptBR })}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            Página {data.pagination.page} de {data.pagination.totalPages} — {data.pagination.total} chamados
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.pagination.page <= 1}
              onClick={() => onFiltersChange({ ...filters, page: data.pagination.page - 1 })}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.pagination.page >= data.pagination.totalPages}
              onClick={() => onFiltersChange({ ...filters, page: data.pagination.page + 1 })}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
