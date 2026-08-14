import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileBarChart, FileText, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useReportSummary } from '@/hooks/useReports';
import { useCustomers } from '@/hooks/useCustomers';
import { useCategories } from '@/hooks/useCategories';
import { userService } from '@/services/userService';
import { reportService } from '@/services/reportService';
import { downloadCsv } from '@/utils/csv';
import { exportReportPdf } from '@/utils/reportPdf';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/utils/ticketLabels';
import { toast } from '@/hooks/use-toast';
import type { ReportFilters, TicketPriority, TicketStatus } from '@/types';

const NONE = '__none__';

function toDateInput(iso?: string) {
  return iso ? iso.slice(0, 10) : '';
}

export function ReportsPage() {
  const [filters, setFilters] = React.useState<ReportFilters>({});
  const [exporting, setExporting] = React.useState(false);

  const { data: customers } = useCustomers();
  const { data: categories } = useCategories();
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: userService.list });
  const { data, isLoading } = useReportSummary(filters);

  function setField<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const rows = await reportService.tickets(filters);
      if (rows.length === 0) {
        toast({ title: 'Nada para exportar', description: 'Nenhum chamado encontrado com os filtros atuais.' });
        return;
      }
      downloadCsv(`chamados-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao exportar' });
    } finally {
      setExporting(false);
    }
  }

  function handleExportPdf() {
    if (!data) return;
    exportReportPdf(data, filters, {
      customerName: customers?.find((c) => c.id === filters.customerId)?.tradeName ?? undefined,
      assigneeName: users?.find((u) => u.id === filters.assigneeId)?.name,
      categoryName: categories?.find((c) => c.id === filters.categoryId)?.name,
    });
  }

  const chartData = React.useMemo(
    () => ({
      customer: data?.byCustomer.map((row) => ({ name: row.name, count: row.count })) ?? [],
      category: data?.byCategory.map((row) => ({ name: row.name, count: row.count })) ?? [],
      assignee: data?.byAssignee.map((row) => ({ name: row.name, count: row.count })) ?? [],
    }),
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Chamados abertos, resolvidos, SLA e produtividade.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv} disabled={exporting || isLoading}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={handleExportPdf} disabled={!data || isLoading}>
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5">
            <Label htmlFor="report-start">Período — de</Label>
            <Input
              id="report-start"
              type="date"
              value={toDateInput(filters.start)}
              onChange={(event) =>
                setField('start', event.target.value ? new Date(event.target.value).toISOString() : undefined)
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-end">Período — até</Label>
            <Input
              id="report-end"
              type="date"
              value={toDateInput(filters.end)}
              onChange={(event) =>
                setField('end', event.target.value ? new Date(event.target.value).toISOString() : undefined)
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={filters.customerId ?? NONE} onValueChange={(v) => setField('customerId', v === NONE ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todos</SelectItem>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.tradeName ?? customer.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Responsável</Label>
            <Select value={filters.assigneeId ?? NONE} onValueChange={(v) => setField('assigneeId', v === NONE ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todos</SelectItem>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={filters.categoryId ?? NONE} onValueChange={(v) => setField('categoryId', v === NONE ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todas</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select
              value={filters.priority ?? NONE}
              onValueChange={(v) => setField('priority', v === NONE ? undefined : (v as TicketPriority))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todas</SelectItem>
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={filters.status ?? NONE}
              onValueChange={(v) => setField('status', v === NONE ? undefined : (v as TicketStatus))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todos</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-semibold">{data.totals.total}</p>
                <p className="text-xs text-muted-foreground">Total de chamados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-semibold">{data.totals.open}</p>
                <p className="text-xs text-muted-foreground">Em aberto</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-semibold">{data.totals.resolved}</p>
                <p className="text-xs text-muted-foreground">Resolvidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-semibold">
                  {data.totals.avgResolutionHours > 0 ? `${data.totals.avgResolutionHours}h` : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Tempo médio de resolução</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-semibold">
                  {data.totals.slaCompliancePercent !== null ? `${data.totals.slaCompliancePercent}%` : '—'}
                </p>
                <p className="text-xs text-muted-foreground">SLA cumprido</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Chamados por cliente</CardTitle>
                <CardDescription>Top 10 clientes com mais chamados no período filtrado.</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.customer.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData.customer} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" name="Chamados" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Chamados por categoria</CardTitle>
                <CardDescription>Distribuição por categoria no período filtrado.</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.category.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData.category} margin={{ left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" name="Chamados" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-foreground">Chamados por atendente</CardTitle>
                <CardDescription>Produtividade por colaborador no período filtrado.</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.assignee.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData.assignee} margin={{ left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" name="Chamados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <FileBarChart className="h-6 w-6" />
      Nenhum dado para os filtros atuais.
    </div>
  );
}
