import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageSquare, BookOpen, CircleDot, Loader2, RefreshCw, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useIntegrations } from '@/hooks/useIntegrations';
import { integrationService } from '@/services/integrationService';
import { toast } from '@/hooks/use-toast';
import type { IntegrationInfo } from '@/types';

const INTEGRATION_META: Record<
  IntegrationInfo['provider'],
  { label: string; description: string; icon: typeof MessageSquare }
> = {
  TOTALCHAT: {
    label: 'TotalChat',
    description: 'Plataforma de atendimento ao cliente utilizada pela equipe.',
    icon: MessageSquare,
  },
  KNOWLEDGE_BASE: {
    label: 'Base de Conhecimento',
    description: 'Base de artigos e soluções mantida em sistema externo.',
    icon: BookOpen,
  },
};

const STATUS_LABELS: Record<IntegrationInfo['status'], string> = {
  AGUARDANDO_CONFIGURACAO: 'Aguardando configuração',
  CONECTADO: 'Conectado',
  ERRO: 'Erro na configuração',
};

export function SettingsPage() {
  const { data, isLoading } = useIntegrations();
  const [syncConfirmOpen, setSyncConfirmOpen] = React.useState(false);

  const testMutation = useMutation({
    mutationFn: integrationService.testTotalChat,
    onSuccess: () => toast({ title: 'Conexão OK', description: 'Login no TotalChat funcionou normalmente.' }),
    onError: () =>
      toast({ variant: 'destructive', title: 'Falha na conexão', description: 'Verifique usuário/senha no .env.' }),
  });

  const syncMutation = useMutation({
    mutationFn: integrationService.syncTotalChat,
    onSuccess: (result) => {
      if (result.skipped) {
        toast({ variant: 'destructive', title: 'Sincronização não executada', description: result.reason });
        return;
      }
      const created = result.results?.filter((r) => r.action === 'created').length ?? 0;
      const updated = result.results?.filter((r) => r.action === 'updated').length ?? 0;
      const errors = result.results?.filter((r) => r.action === 'error').length ?? 0;
      toast({
        title: 'Sincronização concluída',
        description: `${result.processedContacts ?? 0} contato(s) com mensagens — ${created} chamado(s) criado(s), ${updated} atualizado(s)${errors ? `, ${errors} com erro` : ''}.`,
      });
    },
    onError: () =>
      toast({ variant: 'destructive', title: 'Erro na sincronização', description: 'Veja os logs do backend.' }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Preferências do sistema e status das integrações.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Integrações</CardTitle>
          <CardDescription>
            Nenhuma integração é exibida como conectada até que seja realmente configurada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading &&
            Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}

          {data?.map((integration) => {
            const meta = INTEGRATION_META[integration.provider];
            const Icon = meta.icon;
            return (
              <div
                key={integration.provider}
                className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {integration.provider === 'TOTALCHAT' && integration.status === 'CONECTADO' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={testMutation.isPending}
                        onClick={() => testMutation.mutate()}
                      >
                        {testMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Wifi className="h-3.5 w-3.5" />
                        )}
                        Testar conexão
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={syncMutation.isPending}
                        onClick={() => setSyncConfirmOpen(true)}
                      >
                        {syncMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Sincronizar agora
                      </Button>
                    </>
                  )}
                  <Badge variant={integration.status === 'CONECTADO' ? 'success' : 'secondary'}>
                    <CircleDot className="mr-1 h-3 w-3" />
                    {STATUS_LABELS[integration.status]}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={syncConfirmOpen} onOpenChange={setSyncConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sincronizar chamados do TotalChat agora?</DialogTitle>
            <DialogDescription>
              Isso vai buscar as mensagens não lidas da conta real do TotalChat, <strong>marcá-las como lidas</strong>{' '}
              e criar ou atualizar chamados a partir delas. Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSyncConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setSyncConfirmOpen(false);
                syncMutation.mutate();
              }}
            >
              Sincronizar agora
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
