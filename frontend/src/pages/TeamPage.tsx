import { useQuery } from '@tanstack/react-query';
import { UsersRound } from 'lucide-react';
import { userService } from '@/services/userService';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  GERENTE: 'Gerente',
  SUPORTE: 'Suporte',
  IMPLANTACAO: 'Implantação',
  VISUALIZACAO: 'Visualização',
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function TeamPage() {
  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: userService.list });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Equipe</h1>
        <p className="text-sm text-muted-foreground">
          Colaboradores cadastrados no RT HELPDESK. Métricas de produtividade serão exibidas aqui na próxima
          etapa, junto ao módulo de Chamados.
        </p>
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
            <Card key={member.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.jobTitle}</p>
                  <Badge variant="secondary" className="mt-1">
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
