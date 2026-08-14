import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagMultiSelect } from '@/components/tickets/TagMultiSelect';
import { AttachmentPicker } from '@/components/tickets/AttachmentPicker';
import { useCustomers } from '@/hooks/useCustomers';
import { useCategories, useTags } from '@/hooks/useCategories';
import { userService } from '@/services/userService';
import { ticketService } from '@/services/ticketService';
import { useCreateTicket } from '@/hooks/useTicketMutations';
import { toast } from '@/hooks/use-toast';
import { PRIORITY_LABELS } from '@/utils/ticketLabels';
import type { TicketPriority } from '@/types';

const NONE = '__none__';

export function CreateTicketPage() {
  const navigate = useNavigate();
  const { data: customers, isLoading: loadingCustomers } = useCustomers();
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: userService.list });
  const createTicket = useCreateTicket();

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [customerId, setCustomerId] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string>('');
  const [priority, setPriority] = React.useState<TicketPriority>('NORMAL');
  const [assigneeId, setAssigneeId] = React.useState<string>('');
  const [tagIds, setTagIds] = React.useState<string[]>([]);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!customerId) {
      toast({ variant: 'destructive', title: 'Selecione um cliente' });
      return;
    }

    try {
      const ticket = await createTicket.mutateAsync({
        title,
        description,
        customerId,
        categoryId: categoryId || undefined,
        priority,
        assigneeId: assigneeId || undefined,
        tagIds: tagIds.length ? tagIds : undefined,
      });

      if (files.length > 0) {
        setUploading(true);
        for (const file of files) {
          try {
            await ticketService.uploadAttachment(ticket.id, file);
          } catch {
            toast({ variant: 'destructive', title: `Falha ao anexar ${file.name}` });
          }
        }
        setUploading(false);
      }

      toast({ title: 'Chamado criado', description: `#${ticket.number} — ${ticket.title}` });
      navigate(`/chamados/${ticket.id}`);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao criar chamado', description: 'Verifique os dados e tente novamente.' });
    }
  }

  const isSubmitting = createTicket.isPending || uploading;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Novo chamado</h1>
        <p className="text-sm text-muted-foreground">Registre um novo chamado manualmente.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Detalhes do chamado</CardTitle>
          <CardDescription>Campos marcados são obrigatórios.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="customer">Cliente *</Label>
              <Select value={customerId} onValueChange={setCustomerId} disabled={loadingCustomers}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.tradeName ?? customer.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                required
                minLength={3}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Erro ao emitir NFC-e"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descreva o problema relatado pelo cliente"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoria</Label>
                <Select value={categoryId || NONE} onValueChange={(v) => setCategoryId(v === NONE ? '' : v)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem categoria</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="priority">Prioridade *</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assignee">Responsável</Label>
              <Select value={assigneeId || NONE} onValueChange={(v) => setAssigneeId(v === NONE ? '' : v)}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Não atribuído</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tags</Label>
              <TagMultiSelect tags={tags ?? []} selected={tagIds} onChange={setTagIds} />
            </div>

            <div className="space-y-1.5">
              <Label>Anexos</Label>
              <AttachmentPicker files={files} onChange={setFiles} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/chamados')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar chamado
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
