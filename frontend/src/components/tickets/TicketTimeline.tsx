import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Circle } from 'lucide-react';
import type { TicketHistoryEntry } from '@/types';

const ACTION_LABELS: Record<string, string> = {
  CHAMADO_CRIADO: 'criou o chamado',
  RESPONSAVEL_ATRIBUIDO: 'atribuiu o responsável',
  RESPONSAVEL_ALTERADO: 'alterou o responsável',
  PRIORIDADE_ALTERADA: 'alterou a prioridade',
  CATEGORIA_ALTERADA: 'alterou a categoria',
  STATUS_ALTERADO: 'alterou o status',
  COMENTARIO_ADICIONADO: 'adicionou um comentário',
  ANEXO_ADICIONADO: 'anexou um arquivo',
  CHAMADO_RESOLVIDO: 'resolveu o chamado',
  CHAMADO_ENCERRADO: 'encerrou o chamado',
};

export function TicketTimeline({ items }: { items: TicketHistoryEntry[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>;
  }

  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3">
          <div className="mt-1 flex flex-col items-center">
            <Circle className="h-2 w-2 fill-primary text-primary" />
            <div className="mt-1 w-px flex-1 bg-border" />
          </div>
          <div className="min-w-0 pb-1">
            <p className="text-sm leading-snug">
              <span className="font-medium">{item.author?.name ?? 'Sistema'}</span>{' '}
              <span className="text-muted-foreground">{ACTION_LABELS[item.action] ?? item.action.toLowerCase()}</span>
              {item.oldValue && item.newValue && (
                <span className="text-muted-foreground">
                  {' '}
                  ({item.oldValue} → {item.newValue})
                </span>
              )}
              {!item.oldValue && item.newValue && (
                <span className="text-muted-foreground"> ({item.newValue})</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
