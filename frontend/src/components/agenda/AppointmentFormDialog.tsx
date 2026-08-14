import * as React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomers } from '@/hooks/useCustomers';
import { userService } from '@/services/userService';
import { useQuery } from '@tanstack/react-query';
import { useCreateAppointment, useDeleteAppointment, useUpdateAppointment } from '@/hooks/useAppointmentMutations';
import { toast } from '@/hooks/use-toast';
import { APPOINTMENT_TYPE_LABELS } from '@/utils/appointmentLabels';
import type { Appointment, AppointmentType } from '@/types';

const NONE = '__none__';

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  defaultRange?: { start: string; end: string } | null;
}

export function AppointmentFormDialog({ open, onOpenChange, appointment, defaultRange }: AppointmentFormDialogProps) {
  const isEditing = !!appointment;
  const { data: customers } = useCustomers();
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: userService.list });

  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const [title, setTitle] = React.useState('');
  const [type, setType] = React.useState<AppointmentType>('SUPORTE');
  const [customerId, setCustomerId] = React.useState('');
  const [assigneeId, setAssigneeId] = React.useState('');
  const [startsAt, setStartsAt] = React.useState('');
  const [endsAt, setEndsAt] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (!open) return;

    if (appointment) {
      setTitle(appointment.title);
      setType(appointment.type);
      setCustomerId(appointment.customer?.id ?? '');
      setAssigneeId(appointment.assignee?.id ?? '');
      setStartsAt(toLocalInput(appointment.startsAt));
      setEndsAt(toLocalInput(appointment.endsAt));
      setDescription(appointment.description ?? '');
      setNotes(appointment.notes ?? '');
    } else {
      setTitle('');
      setType('SUPORTE');
      setCustomerId('');
      setAssigneeId('');
      setStartsAt(defaultRange ? toLocalInput(defaultRange.start) : '');
      setEndsAt(defaultRange ? toLocalInput(defaultRange.end) : '');
      setDescription('');
      setNotes('');
    }
  }, [open, appointment, defaultRange]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const input = {
      title,
      type,
      customerId: customerId || null,
      assigneeId: assigneeId || null,
      startsAt: fromLocalInput(startsAt),
      endsAt: fromLocalInput(endsAt),
      description: description || undefined,
      notes: notes || undefined,
    };

    try {
      if (isEditing) {
        await updateAppointment.mutateAsync({ id: appointment.id, input });
        toast({ title: 'Evento atualizado' });
      } else {
        await createAppointment.mutateAsync(input);
        toast({ title: 'Evento criado' });
      }
      onOpenChange(false);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao salvar evento', description: 'Verifique os dados e tente novamente.' });
    }
  }

  async function handleDelete() {
    if (!appointment) return;
    try {
      await deleteAppointment.mutateAsync(appointment.id);
      toast({ title: 'Evento excluído' });
      onOpenChange(false);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao excluir evento' });
    }
  }

  const isSubmitting = createAppointment.isPending || updateAppointment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar evento' : 'Novo evento'}</DialogTitle>
          <DialogDescription>Preencha os dados do evento da agenda.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="appt-title">Título *</Label>
            <Input id="appt-title" required value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="appt-type">Tipo *</Label>
              <Select value={type} onValueChange={(v) => setType(v as AppointmentType)}>
                <SelectTrigger id="appt-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPOINTMENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="appt-customer">Cliente</Label>
              <Select value={customerId || NONE} onValueChange={(v) => setCustomerId(v === NONE ? '' : v)}>
                <SelectTrigger id="appt-customer">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Nenhum</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.tradeName ?? customer.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appt-assignee">Responsável</Label>
            <Select value={assigneeId || NONE} onValueChange={(v) => setAssigneeId(v === NONE ? '' : v)}>
              <SelectTrigger id="appt-assignee">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="appt-start">Início *</Label>
              <Input
                id="appt-start"
                type="datetime-local"
                required
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-end">Fim *</Label>
              <Input
                id="appt-end"
                type="datetime-local"
                required
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appt-description">Descrição</Label>
            <Textarea id="appt-description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appt-notes">Observações</Label>
            <Textarea id="appt-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>

          <div className="flex items-center justify-between pt-2">
            {isEditing ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={deleteAppointment.isPending}
                onClick={handleDelete}
              >
                {deleteAppointment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Excluir
              </Button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar alterações' : 'Criar evento'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
