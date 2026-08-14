import { Inbox, Loader2, PlayCircle, Clock, UserX, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { StatCard } from '@/components/dashboard/StatCard';
import { PeriodChart } from '@/components/dashboard/PeriodChart';
import { PriorityChart } from '@/components/dashboard/PriorityChart';
import { AssigneeChart } from '@/components/dashboard/AssigneeChart';
import { ResolutionTimeChart } from '@/components/dashboard/ResolutionTimeChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral dos chamados e produtividade da equipe.</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            Não foi possível carregar os dados do dashboard.
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard icon={Inbox} label="Chamados abertos" value={data.cards.open} description="Status: novo" />
            <StatCard
              icon={Loader2}
              label="Em andamento"
              value={data.cards.inProgress}
              description="Sendo atendidos"
            />
            <StatCard
              icon={PlayCircle}
              label="Aguardando cliente"
              value={data.cards.waitingCustomer}
              description="Retorno pendente"
            />
            <StatCard
              icon={UserX}
              label="Aguardando terceiros"
              value={data.cards.waitingThirdParty}
              description="Dependência externa"
            />
            <StatCard
              icon={Clock}
              label="Resolvidos hoje"
              value={data.cards.resolvedToday}
              description="Encerrados no dia"
            />
            <StatCard
              icon={AlertTriangle}
              label="SLA em risco"
              value={data.cards.slaAtRisk}
              description="Vencendo em até 4h"
              tone={data.cards.slaAtRisk > 0 ? 'destructive' : 'default'}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Chamados por período</CardTitle>
                <CardDescription>Abertos e resolvidos nos últimos 14 dias.</CardDescription>
              </CardHeader>
              <CardContent>
                <PeriodChart data={data.byPeriod} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Chamados por prioridade</CardTitle>
                <CardDescription>Distribuição atual da base de chamados.</CardDescription>
              </CardHeader>
              <CardContent>
                <PriorityChart data={data.byPriority} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Chamados por responsável</CardTitle>
                <CardDescription>Quantidade de chamados atribuídos por colaborador.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.byAssignee.length === 0 ? (
                  <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                    Nenhum chamado atribuído ainda.
                  </div>
                ) : (
                  <AssigneeChart data={data.byAssignee} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Tempo médio de resolução</CardTitle>
                <CardDescription>Evolução do tempo médio de resolução (horas).</CardDescription>
              </CardHeader>
              <CardContent>
                <ResolutionTimeChart data={data.resolutionTimeEvolution} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Atividade recente</CardTitle>
              <CardDescription>Últimas movimentações nos chamados.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivity items={data.recentActivity} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
