import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketFilters, type TicketFilterValue } from '@/components/tickets/TicketFilters';
import { TicketsTable } from '@/components/tickets/TicketsTable';
import { TicketsKanban } from '@/components/tickets/TicketsKanban';
import { useTicketBoard, useTickets } from '@/hooks/useTickets';
import type { TicketListFilters } from '@/types';

type ViewMode = 'list' | 'kanban';

export function TicketsPage() {
  const navigate = useNavigate();
  const [view, setView] = React.useState<ViewMode>('list');
  const [filters, setFilters] = React.useState<TicketListFilters>({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const filterValue: TicketFilterValue = {
    search: filters.search,
    status: filters.status,
    priority: filters.priority,
    assigneeId: filters.assigneeId,
    categoryId: filters.categoryId,
  };

  function handleFilterValueChange(next: TicketFilterValue) {
    setFilters((prev) => ({ ...prev, ...next, page: 1 }));
  }

  const listQuery = useTickets(filters);
  const boardQuery = useTicketBoard({
    priority: filters.priority,
    assigneeId: filters.assigneeId,
    customerId: filters.customerId,
    categoryId: filters.categoryId,
    search: filters.search,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Chamados</h1>
          <p className="text-sm text-muted-foreground">Gerencie os chamados de suporte e implantação.</p>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button onClick={() => navigate('/chamados/novo')}>
            <Plus className="h-4 w-4" />
            Novo chamado
          </Button>
        </div>
      </div>

      <TicketFilters value={filterValue} onChange={handleFilterValueChange} showStatus={view === 'list'} />

      {view === 'list' ? (
        <TicketsTable
          data={listQuery.data}
          isLoading={listQuery.isLoading}
          filters={filters}
          onFiltersChange={setFilters}
        />
      ) : (
        <TicketsKanban tickets={boardQuery.data} isLoading={boardQuery.isLoading} />
      )}
    </div>
  );
}
