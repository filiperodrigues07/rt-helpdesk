import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { tenantService } from '@/services/tenantService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TenantFormDialog } from '@/components/super-admin/TenantFormDialog';
import { useSetTenantActive } from '@/hooks/useTenantMutations';
import { toast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function SuperAdminTenantsPage() {
  useDocumentTitle('Painel Super Admin');

  const { data, isLoading } = useQuery({ queryKey: ['super-admin', 'tenants'], queryFn: tenantService.list });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const setActive = useSetTenantActive();

  async function handleToggle(id: string, active: boolean) {
    try {
      await setActive.mutateAsync({ id, active: !active });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao atualizar status do tenant' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tenants</h1>
          <p className="text-sm text-muted-foreground">Empresas clientes cadastradas na plataforma.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo tenant
        </Button>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {data && (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Slug</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Criado em</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum tenant cadastrado ainda.
                  </td>
                </tr>
              )}
              {data.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-4 py-3 font-medium">{tenant.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tenant.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant={tenant.active ? 'success' : 'outline'}>
                      {tenant.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={setActive.isPending}
                      onClick={() => handleToggle(tenant.id, tenant.active)}
                    >
                      {tenant.active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TenantFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
