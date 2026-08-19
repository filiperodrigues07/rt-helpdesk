import * as React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import { toast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function SuperAdminLoginPage() {
  useDocumentTitle('Painel Super Admin');

  const { login, isAuthenticated, isLoading } = useSuperAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/super-admin" replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/super-admin', { replace: true });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Falha no login',
        description: 'Verifique suas credenciais e tente novamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <ShieldCheck className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Painel Super Admin</h1>
          <p className="text-sm text-muted-foreground">Acesso restrito ao operador da plataforma.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="sa-email">E-mail</Label>
            <Input
              id="sa-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sa-password">Senha</Label>
            <Input
              id="sa-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11"
            />
          </div>

          <Button type="submit" className="h-11 w-full text-sm font-medium" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
