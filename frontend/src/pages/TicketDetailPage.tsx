import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { SlaIndicator } from '@/components/tickets/SlaIndicator';
import { TicketTimeline } from '@/components/tickets/TicketTimeline';
import { TicketComments } from '@/components/tickets/TicketComments';
import { TicketConversation } from '@/components/tickets/TicketConversation';
import { TicketReplyBox } from '@/components/tickets/TicketReplyBox';
import { TicketAttachments } from '@/components/tickets/TicketAttachments';
import { TicketKnowledgeBase } from '@/components/tickets/TicketKnowledgeBase';
import { TicketStatusControl } from '@/components/tickets/TicketStatusControl';
import { useTicket } from '@/hooks/useTicket';
import { useUpdateTicket } from '@/hooks/useTicketMutations';
import { useCategories } from '@/hooks/useCategories';
import { userService } from '@/services/userService';
import { toast } from '@/hooks/use-toast';
import { PRIORITY_LABELS, TERMINAL_STATUSES } from '@/utils/ticketLabels';
import type { TicketPriority } from '@/types';

const NONE = '__none__';
const TIMELINE_PREVIEW_COUNT = 3;

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ticket, isLoading } = useTicket(id);
  const { data: categories } = useCategories();
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: userService.list });

  const updateTicket = useUpdateTicket(id ?? '');

  const [showFullTimeline, setShowFullTimeline] = React.useState(false);

  if (isLoading || !ticket) {
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

  function handlePriorityChange(value: string) {
    updateTicket.mutate(
      { priority: value as TicketPriority },
      { onError: () => toast({ variant: 'destructive', title: 'Erro ao alterar prioridade' }) },
    );
  }

  function handleAssigneeChange(value: string) {
    updateTicket.mutate(
      { assigneeId: value === NONE ? null : value },
      { onError: () => toast({ variant: 'destructive', title: 'Erro ao alterar responsável' }) },
    );
  }

  function handleCategoryChange(value: string) {
    updateTicket.mutate(
      { categoryId: value === NONE ? null : value },
      { onError: () => toast({ variant: 'destructive', title: 'Erro ao alterar categoria' }) },
    );
  }

  const isTerminal = TERMINAL_STATUSES.includes(ticket.status);
  const visibleHistory = showFullTimeline ? ticket.history : ticket.history.slice(0, TIMELINE_PREVIEW_COUNT);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/chamados')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">#{ticket.number}</p>
          <h1 className="truncate text-lg font-semibold">{ticket.title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-foreground">{ticket.description}</p>
              {ticket.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ticket.tags.map(({ tag }) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {ticket.origin === 'TOTALCHAT' && ticket.totalchatContactId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Conversa no TotalChat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <TicketConversation ticketId={ticket.id} />
                <TicketReplyBox ticketId={ticket.id} />
              </CardContent>
            </Card>
          )}

          {isTerminal && (ticket.resolvedProblem || ticket.rootCause || ticket.appliedSolution) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Solução</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Problema identificado</p>
                  <p className="whitespace-pre-wrap">{ticket.resolvedProblem}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Causa raiz</p>
                  <p className="whitespace-pre-wrap">{ticket.rootCause}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Solução aplicada</p>
                  <p className="whitespace-pre-wrap">{ticket.appliedSolution}</p>
                </div>
                {ticket.observations && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Observações</p>
                    <p className="whitespace-pre-wrap">{ticket.observations}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Comentários</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketComments ticketId={ticket.id} comments={ticket.comments} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketTimeline items={visibleHistory} />
              {ticket.history.length > TIMELINE_PREVIEW_COUNT && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowFullTimeline((prev) => !prev)}
                >
                  {showFullTimeline ? 'Ver menos' : 'Ver histórico completo'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketStatusControl ticket={ticket} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Cliente</p>
                <p className="text-sm">{ticket.customer.tradeName ?? ticket.customer.companyName}</p>
              </div>

              <Separator />

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Prioridade</p>
                <Select value={ticket.priority} onValueChange={handlePriorityChange} disabled={isTerminal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Responsável</p>
                <Select value={ticket.assignee?.id ?? NONE} onValueChange={handleAssigneeChange} disabled={isTerminal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Não atribuído</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Categoria</p>
                <Select value={ticket.category?.id ?? NONE} onValueChange={handleCategoryChange} disabled={isTerminal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem categoria</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">SLA</p>
                <SlaIndicator slaDueAt={ticket.slaDueAt} status={ticket.status} />
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Aberto em</p>
                <p className="text-sm">{format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>

              <Badge variant="secondary">
                Origem: {ticket.origin === 'TOTALCHAT' ? 'TotalChat' : 'Manual'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Anexos</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketAttachments ticketId={ticket.id} attachments={ticket.attachments} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <TicketKnowledgeBase query={ticket.description} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
