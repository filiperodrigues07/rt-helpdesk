import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, Pencil, Ticket, Clock, CheckCircle2, CalendarDays, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { useCustomer } from '@/hooks/useCustomers';

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  SUPORTE: 'Suporte',
  IMPLANTACAO: 'Implantação',
  TREINAMENTO: 'Treinamento',
  REUNIAO: 'Reunião',
  VISITA_TECNICA: 'Visita técnica',
  RETORNO_CLIENTE: 'Retorno ao cliente',
  INTERNO: 'Interno',
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomer(id);

  if (isLoading || !customer) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const totalTickets = customer.byStatus.reduce((sum, row) => sum + row.count, 0);
  const resolvedTickets = customer.byStatus
    .filter((row) => row.status === 'RESOLVIDO' || row.status === 'ENCERRADO')
    .reduce((sum, row) => sum + row.count, 0);
  const openTickets = totalTickets - resolvedTickets;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{customer.tradeName ?? customer.companyName}</h1>
          {customer.tradeName && <p className="text-xs text-muted-foreground">{customer.companyName}</p>}
        </div>
        <Button variant="outline" onClick={() => navigate(`/clientes/${customer.id}/editar`)}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Ticket className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{totalTickets}</p>
              <p className="text-xs text-muted-foreground">Chamados totais</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-warning/10 text-warning">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{openTickets}</p>
              <p className="text-xs text-muted-foreground">Em aberto</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-success/10 text-success">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{resolvedTickets}</p>
              <p className="text-xs text-muted-foreground">Resolvidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                {customer.avgResolutionHours > 0 ? `${customer.avgResolutionHours}h` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Tempo médio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Chamados recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.recentTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum chamado registrado para este cliente.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {customer.recentTickets.map((ticket) => (
                    <li key={ticket.id}>
                      <Link
                        to={`/chamados/${ticket.id}`}
                        className="flex items-center justify-between gap-3 py-2.5 hover:text-primary"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            #{ticket.number} {ticket.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <PriorityBadge priority={ticket.priority} />
                          <StatusBadge status={ticket.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Agenda</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento de agenda para este cliente.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {customer.appointments.map((appointment) => (
                    <li key={appointment.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{appointment.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(appointment.startsAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            {appointment.assignee ? ` — ${appointment.assignee.name}` : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{APPOINTMENT_TYPE_LABELS[appointment.type]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Dados de contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">CNPJ</p>
                <p>{customer.cnpj ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Telefone</p>
                <p>{customer.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">E-mail</p>
                <p>{customer.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Cidade</p>
                <p>{customer.city ?? '—'}</p>
              </div>
              {customer.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Observações</p>
                  <p className="whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Responsáveis</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.responsaveis.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum chamado atribuído ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {customer.responsaveis.map((item) =>
                    item.user ? (
                      <li key={item.user.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">{initials(item.user.name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{item.user.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.count} chamado(s)</span>
                      </li>
                    ) : null,
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          {customer.contacts.some((contact) => contact.totalchatContactId) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Contatos TotalChat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {customer.contacts
                    .filter((contact) => contact.totalchatContactId)
                    .map((contact) => (
                      <li key={contact.id} className="text-muted-foreground">
                        {contact.name} {contact.phone ? `— ${contact.phone}` : ''}
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
