import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Search,
  Ticket,
  CalendarDays,
  Upload,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnResizeHandle } from '@/components/ui/column-resize-handle';
import { useCustomerList } from '@/hooks/useCustomers';
import { useResizableColumns } from '@/hooks/useResizableColumns';
import { customerService } from '@/services/customerService';
import { downloadCsv } from '@/utils/csv';
import { toast } from '@/hooks/use-toast';
import { ImportCustomersDialog } from '@/components/customers/ImportCustomersDialog';

const COLUMNS = [
  { id: 'name', label: 'Cliente' },
  { id: 'cnpj', label: 'CNPJ' },
  { id: 'phone', label: 'Telefone' },
  { id: 'city', label: 'Cidade' },
  { id: 'tickets', label: 'Chamados' },
  { id: 'appointments', label: 'Agenda' },
  { id: 'actions', label: '' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  name: 260,
  cnpj: 160,
  phone: 150,
  city: 140,
  tickets: 110,
  appointments: 110,
  actions: 64,
};

export function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [importOpen, setImportOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const { data, isLoading } = useCustomerList({ page, pageSize: 20, search: search || undefined });
  const { widths, startResize } = useResizableColumns(DEFAULT_COLUMN_WIDTHS, 'rt-helpdesk:clientes-table-columns');

  async function handleExport() {
    setExporting(true);
    try {
      const customers = await customerService.exportAll();
      if (customers.length === 0) {
        toast({ title: 'Nada para exportar', description: 'Nenhum cliente cadastrado ainda.' });
        return;
      }
      downloadCsv(
        `clientes-${new Date().toISOString().slice(0, 10)}.csv`,
        customers.map((customer) => ({
          'Razão Social': customer.companyName,
          'Nome Fantasia': customer.tradeName ?? '',
          CNPJ: customer.cnpj ?? '',
          Telefone: customer.phone ?? '',
          'E-mail': customer.email ?? '',
          Cidade: customer.city ?? '',
          Chamados: customer._count.tickets,
          'Data de cadastro': customer.createdAt.slice(0, 10),
        })),
      );
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao exportar' });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro de clientes atendidos pela equipe.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Importar CSV
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => navigate('/clientes/novo')}>
            <Plus className="h-4 w-4" />
            Novo cliente
          </Button>
        </div>
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
          <table className="w-full table-fixed text-sm">
            <colgroup>
              {COLUMNS.map((column) => (
                <col key={column.id} style={{ width: widths[column.id] }} />
              ))}
            </colgroup>
            <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                {COLUMNS.map((column) => (
                  <th key={column.id} className="relative overflow-hidden whitespace-nowrap px-4 py-2 font-medium">
                    {column.label}
                    {column.id !== 'actions' && <ColumnResizeHandle onPointerDown={startResize(column.id)} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td className="px-4 py-3" colSpan={7}>
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))}

              {!isLoading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
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
                    <td className="overflow-hidden px-4 py-3">
                      <p className="truncate font-medium">{customer.tradeName ?? customer.companyName}</p>
                      {customer.tradeName && (
                        <p className="truncate text-xs text-muted-foreground">{customer.companyName}</p>
                      )}
                    </td>
                    <td className="overflow-hidden whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {customer.cnpj ?? '—'}
                    </td>
                    <td className="overflow-hidden whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {customer.phone ?? '—'}
                    </td>
                    <td className="overflow-hidden whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {customer.city ?? '—'}
                    </td>
                    <td className="overflow-hidden whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Ticket className="h-3.5 w-3.5" />
                        {customer._count.tickets}
                      </span>
                    </td>
                    <td className="overflow-hidden whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {customer._count.appointments}
                      </span>
                    </td>
                    <td className="overflow-hidden whitespace-nowrap px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/clientes/${customer.id}/editar`);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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

      <ImportCustomersDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
