import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomer } from '@/hooks/useCustomers';
import { useCreateCustomer, useDeleteCustomer, useUpdateCustomer } from '@/hooks/useCustomerMutations';
import { toast } from '@/hooks/use-toast';
import type { CustomerInput } from '@/types';

const EMPTY_FORM: CustomerInput = {
  companyName: '',
  tradeName: '',
  cnpj: '',
  phone: '',
  email: '',
  city: '',
  notes: '',
};

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();

  const { data: customer, isLoading } = useCustomer(id);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer(id ?? '');
  const deleteCustomer = useDeleteCustomer();
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const [form, setForm] = React.useState<CustomerInput>(EMPTY_FORM);

  React.useEffect(() => {
    setConfirmingDelete(false);
  }, [id]);

  React.useEffect(() => {
    if (customer) {
      setForm({
        companyName: customer.companyName,
        tradeName: customer.tradeName ?? '',
        cnpj: customer.cnpj ?? '',
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        city: customer.city ?? '',
        notes: customer.notes ?? '',
      });
    }
  }, [customer]);

  function setField<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (isEditing) {
        await updateCustomer.mutateAsync(form);
        toast({ title: 'Cliente atualizado' });
        navigate(`/clientes/${id}`);
      } else {
        const created = await createCustomer.mutateAsync(form);
        toast({ title: 'Cliente cadastrado', description: created.companyName });
        navigate(`/clientes/${created.id}`);
      }
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Verifique os dados e tente novamente.';
      toast({ variant: 'destructive', title: 'Erro ao salvar cliente', description: message });
    }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      await deleteCustomer.mutateAsync(id);
      toast({ title: 'Cliente excluído' });
      navigate('/clientes');
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Tente novamente.';
      toast({ variant: 'destructive', title: 'Erro ao excluir cliente', description: message });
    }
  }

  const isSubmitting = createCustomer.isPending || updateCustomer.isPending;

  if (isEditing && isLoading) {
    return <Skeleton className="h-96 w-full max-w-2xl" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{isEditing ? 'Editar cliente' : 'Novo cliente'}</h1>
        <p className="text-sm text-muted-foreground">
          {isEditing ? 'Atualize os dados cadastrais do cliente.' : 'Cadastre um novo cliente no RT Helpdesk.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Dados cadastrais</CardTitle>
          <CardDescription>Apenas a razão social é obrigatória.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Razão social *</Label>
              <Input
                id="companyName"
                required
                minLength={2}
                value={form.companyName}
                onChange={(event) => setField('companyName', event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tradeName">Nome fantasia</Label>
              <Input
                id="tradeName"
                value={form.tradeName}
                onChange={(event) => setField('tradeName', event.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={(event) => setField('cnpj', event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(11) 4000-0000"
                  value={form.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" value={form.city} onChange={(event) => setField('city', event.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                rows={4}
                value={form.notes}
                onChange={(event) => setField('notes', event.target.value)}
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              {isEditing ? (
                confirmingDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Excluir este cliente?</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={deleteCustomer.isPending}
                      onClick={handleDelete}
                    >
                      {deleteCustomer.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Confirmar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                )
              ) : (
                <span />
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isEditing ? 'Salvar alterações' : 'Cadastrar cliente'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
