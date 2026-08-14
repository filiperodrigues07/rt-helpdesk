import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageSquare, BookOpen, CircleDot, ImageUp, Loader2, RefreshCw, Trash2, Wifi } from 'lucide-react';
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
import { useLogo, useRemoveLogo, useUploadLogo } from '@/hooks/useLogo';
import { useAuth } from '@/contexts/AuthContext';
import { BrandLogo } from '@/components/BrandLogo';
import { toast } from '@/hooks/use-toast';
import type { IntegrationInfo } from '@/types';

const CAN_MANAGE_ROLES = ['ADMINISTRADOR', 'GERENTE'];

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
  const { user: currentUser } = useAuth();
  const canManage = !!currentUser && CAN_MANAGE_ROLES.includes(currentUser.role);

  const { data, isLoading } = useIntegrations();
  const [syncConfirmOpen, setSyncConfirmOpen] = React.useState(false);

  const { data: logoUrl, isLoading: logoLoading } = useLogo();
  const uploadLogo = useUploadLogo();
  const removeLogo = useRemoveLogo();
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  async function handleLogoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      await uploadLogo.mutateAsync(file);
      toast({ title: 'Logo atualizada' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao enviar logo', description: 'Use PNG, JPG, GIF, WEBP ou SVG (até 3MB).' });
    }
  }

  async function handleRemoveLogo() {
    try {
      await removeLogo.mutateAsync();
      toast({ title: 'Logo padrão restaurada' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao remover logo' });
    }
  }

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
          <CardTitle className="text-foreground">Identidade visual</CardTitle>
          <CardDescription>
            {canManage
              ? 'Logo exibida na barra lateral e na tela de login.'
              : 'Somente Administrador/Gerente podem alterar a logo do sistema.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logoLoading ? (
            <Skeleton className="h-16 w-16" />
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30 p-2">
                <BrandLogo className="h-full w-full" />
              </div>

              {canManage && (
                <div className="flex flex-col gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoSelect}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploadLogo.isPending}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {uploadLogo.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImageUp className="h-3.5 w-3.5" />
                      )}
                      Enviar nova logo
                    </Button>
                    {logoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={removeLogo.isPending}
                        onClick={handleRemoveLogo}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Restaurar padrão
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP ou SVG — até 3MB.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
