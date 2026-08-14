import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Plus, UsersRound } from 'lucide-react';
import { userService } from '@/services/userService';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserFormDialog } from '@/components/team/UserFormDialog';
import { ROLE_LABELS } from '@/utils/roleLabels';
import { useAuth } from '@/contexts/AuthContext';
import type { TeamMember } from '@/types';

const CAN_MANAGE_ROLES = ['ADMINISTRADOR', 'GERENTE'];

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function TeamPage() {
  const { user: currentUser } = useAuth();
  const canManage = !!currentUser && CAN_MANAGE_ROLES.includes(currentUser.role);

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: userService.list });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<TeamMember | null>(null);

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
            Colaboradores cadastrados no RT HELPDESK. Métricas de produtividade serão exibidas aqui em uma
            próxima etapa.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo usuário
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
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

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((member) => (
            <Card
              key={member.id}
              className={canManage ? 'cursor-pointer hover:border-primary/40' : undefined}
              onClick={() => openEdit(member)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} user={selectedUser} />
    </div>
  );
}
