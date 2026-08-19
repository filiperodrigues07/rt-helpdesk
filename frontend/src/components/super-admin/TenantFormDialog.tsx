import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTenant } from '@/hooks/useTenantMutations';
import { toast } from '@/hooks/use-toast';

interface TenantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function TenantFormDialog({ open, onOpenChange }: TenantFormDialogProps) {
  const createTenant = useCreateTenant();

  const [tenantName, setTenantName] = React.useState('');
  const [tenantSlug, setTenantSlug] = React.useState('');
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [adminName, setAdminName] = React.useState('');
  const [adminEmail, setAdminEmail] = React.useState('');
  const [adminPassword, setAdminPassword] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setTenantName('');
    setTenantSlug('');
    setSlugTouched(false);
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
  }, [open]);

  function handleNameChange(value: string) {
    setTenantName(value);
    if (!slugTouched) setTenantSlug(slugify(value));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createTenant.mutateAsync({ tenantName, tenantSlug, adminName, adminEmail, adminPassword });
      toast({ title: 'Tenant criado com sucesso' });
      onOpenChange(false);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Verifique os dados e tente novamente.';
      toast({ variant: 'destructive', title: 'Erro ao criar tenant', description: message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo tenant</DialogTitle>
          <DialogDescription>Cria a empresa e o primeiro usuário Administrador dela.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="tenant-name">Nome da empresa *</Label>
            <Input id="tenant-name" required value={tenantName} onChange={(e) => handleNameChange(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tenant-slug">Slug *</Label>
            <Input
              id="tenant-slug"
              required
              value={tenantSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setTenantSlug(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tenant-admin-name">Nome do administrador *</Label>
            <Input id="tenant-admin-name" required value={adminName} onChange={(e) => setAdminName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tenant-admin-email">E-mail do administrador *</Label>
            <Input
              id="tenant-admin-email"
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tenant-admin-password">Senha inicial *</Label>
            <Input
              id="tenant-admin-password"
              type="password"
              required
              minLength={6}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTenant.isPending}>
              {createTenant.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar tenant
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
