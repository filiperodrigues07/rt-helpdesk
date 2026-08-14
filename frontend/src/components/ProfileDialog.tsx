import * as React from 'react';
import { Camera, Loader2 } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import { toast } from '@/hooks/use-toast';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function extractErrorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? fallback
  );
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, updateUser } = useAuth();
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [jobTitle, setJobTitle] = React.useState('');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);

  React.useEffect(() => {
    if (!open || !user) return;
    setName(user.name);
    setEmail(user.email);
    setJobTitle(user.jobTitle ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, [open, user]);

  async function handleAvatarSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const updated = await userService.uploadAvatar(file);
      updateUser(updated);
      toast({ title: 'Foto atualizada' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao enviar foto', description: extractErrorMessage(error, 'Use uma imagem de até 3MB.') });
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await userService.updateSelf({ name, email, jobTitle: jobTitle || undefined });
      updateUser(updated);
      toast({ title: 'Perfil atualizado' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar perfil', description: extractErrorMessage(error, 'Tente novamente.') });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'As senhas não conferem' });
      return;
    }

    setSavingPassword(true);
    try {
      const updated = await userService.updateSelf({ currentPassword, newPassword });
      updateUser(updated);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Senha alterada' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao alterar senha', description: extractErrorMessage(error, 'Verifique a senha atual.') });
    } finally {
      setSavingPassword(false);
    }
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Meu perfil</DialogTitle>
          <DialogDescription>Atualize sua foto, dados de contato e senha.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <UserAvatar name={user.name} avatarUrl={user.avatarUrl} className="h-16 w-16" />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">Clique no ícone para trocar a foto (até 3MB).</p>
            </div>
          </div>

          <Separator />

          <form className="space-y-4" onSubmit={handleSaveProfile}>
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nome</Label>
              <Input id="profile-name" required value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">E-mail</Label>
                <Input
                  id="profile-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-jobTitle">Cargo</Label>
                <Input id="profile-jobTitle" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={savingProfile}>
                {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Salvar dados
              </Button>
            </div>
          </form>

          <Separator />

          <form className="space-y-4" onSubmit={handleChangePassword}>
            <p className="text-sm font-medium">Alterar senha</p>
            <div className="space-y-1.5">
              <Label htmlFor="profile-current-password">Senha atual</Label>
              <Input
                id="profile-current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-new-password">Nova senha</Label>
                <Input
                  id="profile-new-password"
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-confirm-password">Confirmar nova senha</Label>
                <Input
                  id="profile-confirm-password"
                  type="password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={savingPassword || !currentPassword || !newPassword}
              >
                {savingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Alterar senha
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
