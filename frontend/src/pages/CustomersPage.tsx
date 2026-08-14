import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronLeft, ChevronRight, Plus, Search, Ticket, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerList } from '@/hooks/useCustomers';

export function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useCustomerList({ page, pageSize: 20, search: search || undefined });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro de clientes atendidos pela equipe.</p>
        </div>
        <Button onClick={() => navigate('/clientes/novo')}>
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por razão social, CNPJ, cidade..."
          className="pl-8"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">CNPJ</th>
                <th className="px-4 py-2 font-medium">Telefone</th>
                <th className="px-4 py-2 font-medium">Cidade</th>
                <th className="px-4 py-2 font-medium">Chamados</th>
                <th className="px-4 py-2 font-medium">Agenda</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td className="px-4 py-3" colSpan={6}>
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))}

              {!isLoading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <Building2 className="mx-auto mb-2 h-6 w-6" />
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}

              {!isLoading &&
                data?.items.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/50"
                    onClick={() => navigate(`/clientes/${customer.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{customer.tradeName ?? customer.companyName}</p>
                      {customer.tradeName && (
                        <p className="text-xs text-muted-foreground">{customer.companyName}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.cnpj ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.phone ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.city ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Ticket className="h-3.5 w-3.5" />
                        {customer._count.tickets}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {customer._count.appointments}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              Página {data.pagination.page} de {data.pagination.totalPages} — {data.pagination.total} clientes
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
