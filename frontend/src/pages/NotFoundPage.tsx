import { ErrorState } from '@/components/ErrorState';

export function NotFoundPage() {
  return (
    <ErrorState
      code="404"
      title="Página não encontrada"
      description="O endereço que você tentou acessar não existe ou foi movido."
      actionLabel="Voltar ao início"
      action={{ to: '/' }}
    />
  );
}
