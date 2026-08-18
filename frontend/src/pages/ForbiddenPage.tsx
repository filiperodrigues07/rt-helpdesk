import { ErrorState } from '@/components/ErrorState';

export function ForbiddenPage() {
  return (
    <ErrorState
      code="403"
      title="Acesso negado"
      description="Sua conta não tem permissão para acessar esta tela. Fale com um administrador se acha que isso é um engano."
      actionLabel="Voltar ao início"
      action={{ to: '/' }}
    />
  );
}
