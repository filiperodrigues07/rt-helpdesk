import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Loader2, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTicketConversation } from '@/hooks/useTicket';
import type { TicketConversationMessage } from '@/services/ticketService';
import { cn } from '@/utils/cn';

function stripSenderPrefix(text: string, senderName: string): string {
  const prefix = `*${senderName}:*\n`;
  return text.startsWith(prefix) ? text.slice(prefix.length) : text;
}

function MessageMedia({ message }: { message: TicketConversationMessage }) {
  if (!message.mediaType || !message.mediaUrl) return null;

  if (message.mediaType === 'imagem') {
    return (
      <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="mt-1 block">
        <img src={message.mediaUrl} alt="Imagem enviada" className="max-h-64 rounded-md" />
      </a>
    );
  }

  if (message.mediaType === 'áudio') {
    return (
      <audio controls className="mt-1 h-9 max-w-full">
        <source src={message.mediaUrl} />
      </audio>
    );
  }

  return (
    <a
      href={message.mediaUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-1 flex items-center gap-1.5 text-xs text-primary hover:underline"
    >
      <FileText className="h-3.5 w-3.5" />
      Abrir documento
    </a>
  );
}

export function TicketConversation({ ticketId }: { ticketId: string }) {
  const [loaded, setLoaded] = React.useState(false);
  const { data, isLoading, isError } = useTicketConversation(ticketId, loaded);

  if (!loaded) {
    return (
      <Button variant="outline" size="sm" onClick={() => setLoaded(true)}>
        <MessageSquareText className="h-3.5 w-3.5" />
        Carregar conversa completa
      </Button>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando conversa do TotalChat...
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Não foi possível carregar a conversa. Tente novamente.</p>;
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma mensagem encontrada para o período deste chamado.</p>;
  }

  return (
    <ul className="space-y-3">
      {data.map((message) => {
        const isCliente = message.direction === 'cliente';
        const text = stripSenderPrefix(message.text, message.senderName).trim();

        return (
          <li key={message.id} className={cn('flex', isCliente ? 'justify-start' : 'justify-end')}>
            <div
              className={cn(
                'max-w-[85%] rounded-md px-3 py-2 text-sm',
                isCliente ? 'bg-muted/60 text-foreground' : 'bg-primary/15 text-foreground',
              )}
            >
              <div className="mb-0.5 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">{message.senderName}</span>
                {message.timestamp && (
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(message.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                )}
              </div>

              {text && <p className="whitespace-pre-wrap">{text}</p>}

              <MessageMedia message={message} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
