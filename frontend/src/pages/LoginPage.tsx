import * as React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { BrandLogo } from '@/components/BrandLogo';
import { BrandWordmark } from '@/components/BrandWordmark';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function LoginPage() {
  useDocumentTitle('Entrar');

  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  if (!isLoading && isAuthenticated) {
    const from = (location.state as { from?: string })?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
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
    <div className="flex min-h-screen bg-background">
      {/* Painel de marca */}
      <div className="relative hidden w-[44%] shrink-0 overflow-hidden bg-[#040b1a] lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 14%, rgba(56,152,255,0.35), transparent 42%), radial-gradient(circle at 82% 78%, rgba(45,212,191,0.18), transparent 48%), linear-gradient(160deg, #040b1a 0%, #061229 48%, #071a33 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 30% 25%, black 0%, transparent 70%)',
          }}
        />

        <div className="relative flex flex-1 flex-col justify-center px-14">
          <BrandLogo className="h-16 w-16" />
          <h1 className="mt-8 text-3xl tracking-tight text-white">
            <BrandWordmark secondaryClassName="text-white/55" />
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
            Central de suporte e implantação — chamados, agenda, clientes e produtividade da equipe em um só lugar.
          </p>
        </div>

        <div className="relative flex items-center gap-2 px-14 pb-10 text-xs text-white/40">
          <ShieldCheck className="h-4 w-4" />
          Acesso restrito à equipe interna
        </div>
      </div>

      {/* Formulário */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex flex-col items-center gap-3 text-center lg:hidden">
            <BrandLogo className="h-12 w-12" />
            <h1 className="text-lg tracking-tight">
              <BrandWordmark secondaryClassName="text-muted-foreground" />
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Bem-vindo de volta</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Entre com suas credenciais para acessar o sistema.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@rthelpdesk.com"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
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
    </div>
  );
}
