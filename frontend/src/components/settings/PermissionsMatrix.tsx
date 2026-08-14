import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { usePermissionMatrix, useUpdateRolePermissions } from '@/hooks/usePermissions';
import { ROLE_LABELS } from '@/utils/roleLabels';

const SCREEN_LABELS: Record<string, string> = {
  'screen.chamados': 'Chamados',
  'screen.agenda': 'Agenda',
  'screen.clientes': 'Clientes',
  'screen.base-conhecimento': 'Base de Conhecimento',
  'screen.equipe': 'Equipe',
  'screen.relatorios': 'Relatórios',
  'screen.configuracoes': 'Configurações',
};

export function PermissionsMatrix() {
  const { data, isLoading } = usePermissionMatrix(true);
  const updateRole = useUpdateRolePermissions();

  const [selection, setSelection] = React.useState<Record<string, string[]>>({});
  const [savingRoleId, setSavingRoleId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!data) return;
    setSelection(Object.fromEntries(data.roles.map((role) => [role.id, role.permissionKeys])));
  }, [data]);

  function toggle(roleId: string, key: string) {
    setSelection((prev) => {
      const current = prev[roleId] ?? [];
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
      return { ...prev, [roleId]: next };
    });
  }

  async function handleSave(roleId: string) {
    setSavingRoleId(roleId);
    try {
      await updateRole.mutateAsync({ roleId, permissionKeys: selection[roleId] ?? [] });
      toast({ title: 'Permissões atualizadas' });
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Tente novamente.';
      toast({ variant: 'destructive', title: 'Erro ao salvar permissões', description: message });
    } finally {
      setSavingRoleId(null);
    }
  }

  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-border p-2 text-left text-xs font-medium text-muted-foreground">Tela</th>
            {data.roles.map((role) => (
              <th key={role.id} className="border-b border-border p-2 text-center text-xs font-medium">
                {ROLE_LABELS[role.name]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.permissions.map((permission) => (
            <tr key={permission.id}>
              <td className="border-b border-border p-2">{SCREEN_LABELS[permission.key] ?? permission.key}</td>
              {data.roles.map((role) => {
                const isAdmin = role.name === 'ADMINISTRADOR';
                const checked = isAdmin || (selection[role.id] ?? []).includes(permission.key);
                return (
                  <td key={role.id} className="border-b border-border p-2 text-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isAdmin}
                      onChange={() => toggle(role.id, permission.key)}
                      className="h-4 w-4 accent-primary disabled:opacity-40"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="p-2" />
            {data.roles.map((role) => (
              <td key={role.id} className="p-2 text-center">
                {role.name === 'ADMINISTRADOR' ? (
                  <span className="text-xs text-muted-foreground">Acesso total</span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={savingRoleId === role.id}
                    onClick={() => handleSave(role.id)}
                  >
                    {savingRoleId === role.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Salvar
                  </Button>
                )}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
