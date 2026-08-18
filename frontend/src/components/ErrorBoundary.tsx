import * as React from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Fica fora do BrowserRouter (o crash pode vir de qualquer nível, incluindo
// o próprio Router), então o fallback não pode depender de hooks de rota —
// "Recarregar página" é um reload de verdade, não navegação client-side.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erro não tratado na aplicação:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen w-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <BrandLogo className="h-10 w-10" />
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold text-foreground">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>Recarregar página</Button>
        {import.meta.env.DEV && (
          <details className="mt-4 max-w-xl text-left text-xs text-muted-foreground">
            <summary className="cursor-pointer">Detalhes do erro (visível só em dev)</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.stack ?? this.state.error.message}</pre>
          </details>
        )}
      </div>
    );
  }
}
