import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, MessageSquare, Plus, UsersRound } from 'lucide-react';
import { userService } from '@/services/userService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { UserFormDialog } from '@/components/team/UserFormDialog';
import { UserAvatar } from '@/components/UserAvatar';
import { ROLE_LABELS } from '@/utils/roleLabels';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/hooks/useViewMode';
import { cn } from '@/utils/cn';
import type { TeamMember } from '@/types';

const CAN_MANAGE_ROLES = ['ADMINISTRADOR', 'GERENTE'];

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold">{value}</p>
      <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

export function TeamPage() {
  const { user: currentUser } = useAuth();
  const canManage = !!currentUser && CAN_MANAGE_ROLES.includes(currentUser.role);

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: userService.list });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<TeamMember | null>(null);
  const [viewMode, setViewMode] = useViewMode('rt-helpdesk:equipe-view-mode');

  function openCreate() {
    setSelectedUser(null);
    setDialogOpen(true);
  }

  function openEdit(member: TeamMember) {
    if (!canManage) return;
    setSelectedUser(member);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Equipe</h1>
          <p className="text-sm text-muted-foreground">
            Colaboradores cadastrados no RT Helpdesk e produtividade de cada um nos chamados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
              aria-label="Visualizar em grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
              aria-label="Visualizar em lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Novo usuário
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className={cn('grid gap-4', viewMode === 'grid' && 'sm:grid-cols-2 lg:grid-cols-3')}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <UsersRound className="h-8 w-8" />
            Nenhum colaborador cadastrado ainda.
          </CardContent>
        </Card>
      )}

      {data && data.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((member) => (
            <Card
              key={member.id}
              className={canManage ? 'cursor-pointer hover:border-primary/40' : undefined}
              onClick={() => openEdit(member)}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <UserAvatar name={member.name} avatarUrl={member.avatarUrl} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">{member.name}</p>
                      {!member.active && (
                        <Badge variant="secondary" className="shrink-0">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{member.jobTitle}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
                      {member.totalchatAttendantId && (
                        <Badge variant="outline" className="gap-1">
                          <MessageSquare className="h-3 w-3" />
                          TotalChat
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-4 gap-2">
                  <StatCell label="Atribuídos" value={String(member.ticketsAssigned)} />
                  <StatCell label="Resolvidos" value={String(member.ticketsResolved)} />
                  <StatCell
                    label="Tempo médio"
                    value={member.avgResolutionHours > 0 ? `${member.avgResolutionHours}h` : '—'}
                  />
                  <StatCell
                    label="SLA"
                    value={member.slaCompliancePercent !== null ? `${member.slaCompliancePercent}%` : '—'}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && data.length > 0 && viewMode === 'list' && (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {data.map((member) => (
              <div
                key={member.id}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 transition-colors',
                  canManage && 'cursor-pointer hover:bg-accent/50',
                )}
                onClick={() => openEdit(member)}
              >
                <UserAvatar name={member.name} avatarUrl={member.avatarUrl} className="h-9 w-9 shrink-0" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium">{member.name}</p>
                    {!member.active && (
                      <Badge variant="secondary" className="shrink-0">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{member.jobTitle}</p>
                </div>

                <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                  <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
                  {member.totalchatAttendantId && (
                    <Badge variant="outline" className="gap-1">
                      <MessageSquare className="h-3 w-3" />
                      TotalChat
                    </Badge>
                  )}
                </div>

                <div className="hidden shrink-0 grid-cols-4 gap-6 md:grid">
                  <StatCell label="Atribuídos" value={String(member.ticketsAssigned)} />
                  <StatCell label="Resolvidos" value={String(member.ticketsResolved)} />
                  <StatCell
                    label="Tempo médio"
                    value={member.avgResolutionHours > 0 ? `${member.avgResolutionHours}h` : '—'}
                  />
                  <StatCell
                    label="SLA"
                    value={member.slaCompliancePercent !== null ? `${member.slaCompliancePercent}%` : '—'}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <UserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} user={selectedUser} />
    </div>
  );
}
