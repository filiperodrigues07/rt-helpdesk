import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  MessageSquare,
  BookOpen,
  ChevronDown,
  CircleDot,
  ImageUp,
  KeyRound,
  Loader2,
  RefreshCw,
  Trash2,
  Wifi,
} from 'lucide-react';
import totalChatLogo from '@/assets/totalchat-logo.jpg';
import chSistemasLogo from '@/assets/ch-sistemas-logo.svg';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  useChErpConfig,
  useIntegrations,
  useTotalChatConfig,
  useUpdateChErpConfig,
  useUpdateTotalChatConfig,
  useWhatsAppSources,
} from '@/hooks/useIntegrations';
import { integrationService } from '@/services/integrationService';
import { useLogo, useRemoveLogo, useUploadLogo } from '@/hooks/useLogo';
import { useAuth } from '@/contexts/AuthContext';
import { BrandLogo } from '@/components/BrandLogo';
import { PermissionsMatrix } from '@/components/settings/PermissionsMatrix';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/utils/cn';
import type { IntegrationInfo } from '@/types';

const CAN_MANAGE_ROLES = ['ADMINISTRADOR', 'GERENTE'];

const INTEGRATION_META: Record<
  IntegrationInfo['provider'],
  { label: string; description: string; icon?: typeof MessageSquare; logo?: string }
> = {
  TOTALCHAT: {
    label: 'TotalChat',
    description: 'Plataforma de atendimento ao cliente utilizada pela equipe.',
    logo: totalChatLogo,
  },
  KNOWLEDGE_BASE: {
    label: 'Base de Conhecimento',
    description: 'Base de artigos e soluções mantida em sistema externo.',
    icon: BookOpen,
  },
  CH_ERP: {
    label: 'CH Sistemas',
    description: 'Base própria do ERP (Integrador BI), usada para importar cadastros de cliente.',
    logo: chSistemasLogo,
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
  const [ceSyncConfirmOpen, setCeSyncConfirmOpen] = React.useState(false);
  const [tcCredentialsOpen, setTcCredentialsOpen] = React.useState(false);
  const [ceCredentialsOpen, setCeCredentialsOpen] = React.useState(false);

  const { data: logoUrl, isLoading: logoLoading } = useLogo();
  const uploadLogo = useUploadLogo();
  const removeLogo = useRemoveLogo();
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const { data: totalChatConfig, isLoading: totalChatConfigLoading } = useTotalChatConfig(canManage);
  const updateTotalChatConfig = useUpdateTotalChatConfig();
  const { data: whatsappSources, isLoading: whatsappSourcesLoading } = useWhatsAppSources(
    canManage && tcCredentialsOpen,
  );

  const { data: chErpConfig, isLoading: chErpConfigLoading } = useChErpConfig(canManage);
  const updateChErpConfig = useUpdateChErpConfig();

  const [ceBaseUrl, setCeBaseUrl] = React.useState('');
  const [ceToken, setCeToken] = React.useState('');
  const [ceCnpjPrincipal, setCeCnpjPrincipal] = React.useState('');
  const [ceChaveEmpresa, setCeChaveEmpresa] = React.useState('1');

  React.useEffect(() => {
    if (!chErpConfig) return;
    setCeBaseUrl(chErpConfig.baseUrl);
    setCeToken('');
    setCeCnpjPrincipal(chErpConfig.cnpjPrincipal);
    setCeChaveEmpresa(String(chErpConfig.chaveEmpresa));
  }, [chErpConfig]);

  async function handleSaveChErpConfig(event: React.FormEvent) {
    event.preventDefault();
    try {
      await updateChErpConfig.mutateAsync({
        baseUrl: ceBaseUrl || undefined,
        token: ceToken || undefined,
        cnpjPrincipal: ceCnpjPrincipal || undefined,
        chaveEmpresa: ceChaveEmpresa ? Number(ceChaveEmpresa) : undefined,
      });
      setCeToken('');
      toast({ title: 'Credenciais do ERP salvas' });
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Verifique os dados e tente novamente.';
      toast({ variant: 'destructive', title: 'Erro ao salvar credenciais', description: message });
    }
  }

  const [tcApiUrl, setTcApiUrl] = React.useState('');
  const [tcUsername, setTcUsername] = React.useState('');
  const [tcPassword, setTcPassword] = React.useState('');
  const [tcConnectionId, setTcConnectionId] = React.useState('');
  const [tcWhatsappCloudApiFid, setTcWhatsappCloudApiFid] = React.useState('');
  const [tcPollingEnabled, setTcPollingEnabled] = React.useState(false);
  const [tcPollIntervalSeconds, setTcPollIntervalSeconds] = React.useState('60');

  React.useEffect(() => {
    if (!totalChatConfig) return;
    setTcApiUrl(totalChatConfig.apiUrl);
    setTcUsername(totalChatConfig.username);
    setTcPassword('');
    setTcConnectionId(totalChatConfig.connectionId ? String(totalChatConfig.connectionId) : '');
    setTcWhatsappCloudApiFid(
      totalChatConfig.whatsappCloudApiFid ? String(totalChatConfig.whatsappCloudApiFid) : '',
    );
    setTcPollingEnabled(totalChatConfig.pollingEnabled);
    setTcPollIntervalSeconds(String(totalChatConfig.pollIntervalSeconds));
  }, [totalChatConfig]);

  async function handleSaveTotalChatConfig(event: React.FormEvent) {
    event.preventDefault();
    try {
      await updateTotalChatConfig.mutateAsync({
        apiUrl: tcApiUrl || undefined,
        username: tcUsername || undefined,
        password: tcPassword || undefined,
        connectionId: tcConnectionId ? Number(tcConnectionId) : null,
        whatsappCloudApiFid: tcWhatsappCloudApiFid ? Number(tcWhatsappCloudApiFid) : null,
        pollingEnabled: tcPollingEnabled,
        pollIntervalSeconds: Number(tcPollIntervalSeconds),
      });
      setTcPassword('');
      toast({ title: 'Credenciais do TotalChat salvas' });
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Verifique os dados e tente novamente.';
      toast({ variant: 'destructive', title: 'Erro ao salvar credenciais', description: message });
    }
  }

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

  const testChErpMutation = useMutation({
    mutationFn: integrationService.testChErp,
    onSuccess: () => toast({ title: 'Conexão OK', description: 'A busca de teste no ERP funcionou normalmente.' }),
    onError: () =>
      toast({ variant: 'destructive', title: 'Falha na conexão', description: 'Verifique o endereço/token do ERP.' }),
  });

  const syncChErpMutation = useMutation({
    mutationFn: integrationService.syncChErp,
    onSuccess: (result) => {
      toast({
        title: 'Importação concluída',
        description: `${result.total} cliente(s) no ERP — ${result.created} criado(s), ${result.updated} atualizado(s)${result.skipped ? `, ${result.skipped} ignorado(s) (sem CNPJ válido)` : ''}.`,
      });
    },
    onError: () =>
      toast({ variant: 'destructive', title: 'Erro na importação', description: 'Veja os logs do backend.' }),
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
      const skipped = result.results?.filter((r) => r.action === 'skipped').length ?? 0;
      const errors = result.results?.filter((r) => r.action === 'error').length ?? 0;
      toast({
        title: 'Sincronização concluída',
        description: `${result.processedContacts ?? 0} contato(s) com mensagens — ${created} chamado(s) criado(s), ${updated} atualizado(s)${skipped ? `, ${skipped} já processado(s)` : ''}${errors ? `, ${errors} com erro` : ''}.`,
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

      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
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

          {currentUser?.role === 'ADMINISTRADOR' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Permissões por papel</CardTitle>
                <CardDescription>Controle quais telas cada papel pode acessar.</CardDescription>
              </CardHeader>
              <CardContent>
                <PermissionsMatrix />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-6">
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
                const isTotalChat = integration.provider === 'TOTALCHAT';
                const isChErp = integration.provider === 'CH_ERP';

                return (
                  <div key={integration.provider} className="rounded-md border border-border">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-3">
                        {meta.logo ? (
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-white p-1">
                            <img src={meta.logo} alt={meta.label} className="h-full w-full object-contain" />
                          </div>
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            {Icon && <Icon className="h-4 w-4" />}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{meta.label}</p>
                          <p className="text-xs text-muted-foreground">{meta.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isTotalChat && integration.status === 'CONECTADO' && (
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
                        {isChErp && integration.status === 'CONECTADO' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={testChErpMutation.isPending}
                              onClick={() => testChErpMutation.mutate()}
                            >
                              {testChErpMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Wifi className="h-3.5 w-3.5" />
                              )}
                              Testar conexão
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={syncChErpMutation.isPending}
                              onClick={() => setCeSyncConfirmOpen(true)}
                            >
                              {syncChErpMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              Importar clientes
                            </Button>
                          </>
                        )}
                        <Badge variant={integration.status === 'CONECTADO' ? 'success' : 'secondary'}>
                          <CircleDot className="mr-1 h-3 w-3" />
                          {STATUS_LABELS[integration.status]}
                        </Badge>
                        {isTotalChat && canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setTcCredentialsOpen((prev) => !prev)}
                            aria-label={tcCredentialsOpen ? 'Ocultar credenciais' : 'Mostrar credenciais'}
                          >
                            <ChevronDown
                              className={cn('h-4 w-4 transition-transform', tcCredentialsOpen && 'rotate-180')}
                            />
                          </Button>
                        )}
                        {isChErp && canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCeCredentialsOpen((prev) => !prev)}
                            aria-label={ceCredentialsOpen ? 'Ocultar credenciais' : 'Mostrar credenciais'}
                          >
                            <ChevronDown
                              className={cn('h-4 w-4 transition-transform', ceCredentialsOpen && 'rotate-180')}
                            />
                          </Button>
                        )}
                      </div>
                    </div>

                    {isTotalChat && canManage && tcCredentialsOpen && (
                      <div className="border-t border-border p-4">
                        <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <KeyRound className="h-4 w-4" />
                          Credenciais do TotalChat
                        </div>
                        <p className="mb-4 text-xs text-muted-foreground">
                          Usuário e senha da plataforma TotalChat. Recomendado usar um usuário de serviço dedicado.
                        </p>

                        {totalChatConfigLoading ? (
                          <Skeleton className="h-48 w-full" />
                        ) : (
                          <form className="space-y-4" onSubmit={handleSaveTotalChatConfig}>
                            <div className="space-y-1.5">
                              <Label htmlFor="tc-api-url">URL da API</Label>
                              <Input
                                id="tc-api-url"
                                placeholder="https://api.totalchat.com.br/"
                                value={tcApiUrl}
                                onChange={(event) => setTcApiUrl(event.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label htmlFor="tc-username">Usuário</Label>
                                <Input
                                  id="tc-username"
                                  value={tcUsername}
                                  onChange={(event) => setTcUsername(event.target.value)}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="tc-password">Senha</Label>
                                <Input
                                  id="tc-password"
                                  type="password"
                                  value={tcPassword}
                                  onChange={(event) => setTcPassword(event.target.value)}
                                  placeholder={totalChatConfig?.hasPassword ? 'Deixe em branco para manter a atual' : undefined}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <Label htmlFor="tc-connection-id">Connection ID</Label>
                                <Input
                                  id="tc-connection-id"
                                  type="number"
                                  placeholder="Conexão principal"
                                  value={tcConnectionId}
                                  onChange={(event) => setTcConnectionId(event.target.value)}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="tc-polling">Sincronização automática</Label>
                                <Select
                                  value={tcPollingEnabled ? 'true' : 'false'}
                                  onValueChange={(value) => setTcPollingEnabled(value === 'true')}
                                >
                                  <SelectTrigger id="tc-polling">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="false">Desligada</SelectItem>
                                    <SelectItem value="true">Ligada</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="tc-interval">Intervalo (segundos)</Label>
                                <Input
                                  id="tc-interval"
                                  type="number"
                                  min={10}
                                  max={3600}
                                  value={tcPollIntervalSeconds}
                                  onChange={(event) => setTcPollIntervalSeconds(event.target.value)}
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="tc-whatsapp-fid">Fonte WhatsApp Cloud API</Label>
                              <Select
                                value={tcWhatsappCloudApiFid}
                                onValueChange={setTcWhatsappCloudApiFid}
                                disabled={whatsappSourcesLoading || (whatsappSources?.length ?? 0) === 0}
                              >
                                <SelectTrigger id="tc-whatsapp-fid">
                                  <SelectValue
                                    placeholder={
                                      whatsappSourcesLoading
                                        ? 'Carregando...'
                                        : whatsappSources?.length
                                          ? 'Selecione a conexão'
                                          : 'Nenhuma conexão Cloud API encontrada'
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {whatsappSources?.map((source) => (
                                    <SelectItem key={source.id} value={String(source.id)}>
                                      {source.nome} ({source.telefone})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Usada para enviar templates aprovados fora da janela de 24h do WhatsApp.
                              </p>
                            </div>

                            <div className="flex justify-end">
                              <Button type="submit" size="sm" disabled={updateTotalChatConfig.isPending}>
                                {updateTotalChatConfig.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Salvar credenciais
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {isChErp && canManage && ceCredentialsOpen && (
                      <div className="border-t border-border p-4">
                        <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <KeyRound className="h-4 w-4" />
                          Credenciais do ERP
                        </div>
                        <p className="mb-4 text-xs text-muted-foreground">
                          Conexão com a base própria do ERP (Integrador BI). O token é gerado no CHServer em
                          Configurações → Integrador BI.
                        </p>

                        {chErpConfigLoading ? (
                          <Skeleton className="h-48 w-full" />
                        ) : (
                          <form className="space-y-4" onSubmit={handleSaveChErpConfig}>
                            <div className="space-y-1.5">
                              <Label htmlFor="ce-base-url">Endereço do CHServerWeb</Label>
                              <Input
                                id="ce-base-url"
                                placeholder="http://endereco-do-servidor:8080/"
                                value={ceBaseUrl}
                                onChange={(event) => setCeBaseUrl(event.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label htmlFor="ce-token">Token</Label>
                                <Input
                                  id="ce-token"
                                  type="password"
                                  value={ceToken}
                                  onChange={(event) => setCeToken(event.target.value)}
                                  placeholder={chErpConfig?.hasToken ? 'Deixe em branco para manter o atual' : undefined}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="ce-cnpj-principal">CNPJ da estrutura principal</Label>
                                <Input
                                  id="ce-cnpj-principal"
                                  value={ceCnpjPrincipal}
                                  onChange={(event) => setCeCnpjPrincipal(event.target.value)}
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="ce-chave-empresa">Chave da empresa</Label>
                              <Input
                                id="ce-chave-empresa"
                                type="number"
                                min={1}
                                value={ceChaveEmpresa}
                                onChange={(event) => setCeChaveEmpresa(event.target.value)}
                              />
                            </div>

                            <div className="flex justify-end">
                              <Button type="submit" size="sm" disabled={updateChErpConfig.isPending}>
                                {updateChErpConfig.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Salvar credenciais
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={syncConfirmOpen} onOpenChange={setSyncConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sincronizar chamados do TotalChat agora?</DialogTitle>
            <DialogDescription>
              Isso vai buscar as mensagens não lidas da conta real do TotalChat e criar ou atualizar chamados a
              partir delas. As mensagens não são marcadas como lidas no TotalChat.
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

      <Dialog open={ceSyncConfirmOpen} onOpenChange={setCeSyncConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar clientes do ERP agora?</DialogTitle>
            <DialogDescription>
              Isso vai buscar todos os cadastros de cliente da base do ERP e criar ou atualizar clientes aqui,
              casando pelo CNPJ. Clientes sem CNPJ válido (pessoa física) são ignorados.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCeSyncConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setCeSyncConfirmOpen(false);
                syncChErpMutation.mutate();
              }}
            >
              Importar clientes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
