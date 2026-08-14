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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoles } from '@/hooks/useRoles';
import { useTotalChatAttendants } from '@/hooks/useTotalChatAttendants';
import { useCreateUser, useDeleteUser, useUpdateUser } from '@/hooks/useUserMutations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ROLE_LABELS } from '@/utils/roleLabels';
import type { TeamMember } from '@/types';

const NONE = '__none__';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: TeamMember | null;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEditing = !!user;
  const { user: currentUser } = useAuth();
  const { data: roles } = useRoles();
  const { data: attendants } = useTotalChatAttendants();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [jobTitle, setJobTitle] = React.useState('');
  const [roleId, setRoleId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [active, setActive] = React.useState(true);
  const [totalchatAttendantId, setTotalchatAttendantId] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setConfirmingDelete(false);

    if (user) {
      setName(user.name);
      setEmail(user.email);
      setJobTitle(user.jobTitle ?? '');
      setRoleId(user.roleId);
      setPassword('');
      setActive(user.active);
      setTotalchatAttendantId(user.totalchatAttendantId ?? '');
    } else {
      setName('');
      setEmail('');
      setJobTitle('');
      setRoleId('');
      setPassword('');
      setActive(true);
      setTotalchatAttendantId('');
    }
  }, [open, user]);

  function handleAttendantChange(value: string) {
    const attendantId = value === NONE ? '' : value;
    setTotalchatAttendantId(attendantId);

    if (!isEditing && !name.trim() && attendantId) {
      const attendant = attendants?.find((item) => item.id === attendantId);
      if (attendant) setName(attendant.nome);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      if (isEditing) {
        await updateUser.mutateAsync({
          id: user.id,
          input: {
            name,
            email,
            jobTitle: jobTitle || undefined,
            roleId,
            active,
            totalchatAttendantId: totalchatAttendantId || null,
            password: password || undefined,
          },
        });
        toast({ title: 'Usuário atualizado' });
      } else {
        await createUser.mutateAsync({
          name,
          email,
          password,
          jobTitle: jobTitle || undefined,
          roleId,
          totalchatAttendantId: totalchatAttendantId || null,
        });
        toast({ title: 'Usuário criado' });
      }
      onOpenChange(false);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Verifique os dados e tente novamente.';
      toast({ variant: 'destructive', title: 'Erro ao salvar usuário', description: message });
    }
  }

  async function handleDelete() {
    if (!user) return;
    try {
      await deleteUser.mutateAsync(user.id);
      toast({ title: 'Usuário excluído' });
      onOpenChange(false);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Tente novamente.';
      toast({ variant: 'destructive', title: 'Erro ao excluir usuário', description: message });
    }
  }

  const isSubmitting = createUser.isPending || updateUser.isPending;
  const isSelf = !!user && !!currentUser && user.id === currentUser.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados do colaborador.' : 'Cadastre um novo colaborador no RT HELPDESK.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="user-totalchat">Atendente no TotalChat</Label>
            <Select value={totalchatAttendantId || NONE} onValueChange={handleAttendantChange}>
              <SelectTrigger id="user-totalchat">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Nenhum</SelectItem>
                {attendants?.map((attendant) => (
                  <SelectItem key={attendant.id} value={attendant.id}>
                    {attendant.nome} — {attendant.departamento}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecionar preenche o nome automaticamente e vincula este usuário ao atendente correspondente.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-name">Nome *</Label>
            <Input id="user-name" required value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-email">E-mail *</Label>
              <Input
                id="user-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-jobTitle">Cargo</Label>
              <Input id="user-jobTitle" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-role">Papel *</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="user-role">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {ROLE_LABELS[role.name]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="user-active">Status</Label>
                <Select value={active ? 'true' : 'false'} onValueChange={(v) => setActive(v === 'true')}>
                  <SelectTrigger id="user-active">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-password">{isEditing ? 'Nova senha (opcional)' : 'Senha *'}</Label>
            <Input
              id="user-password"
              type="password"
              required={!isEditing}
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isEditing ? 'Deixe em branco para manter a atual' : undefined}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {isEditing && !isSelf ? (
              confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Excluir este usuário?</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deleteUser.isPending}
                    onClick={handleDelete}
                  >
                    {deleteUser.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !roleId}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar alterações' : 'Criar usuário'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
