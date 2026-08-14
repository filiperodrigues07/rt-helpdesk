import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAddComment } from '@/hooks/useTicketMutations';
import { toast } from '@/hooks/use-toast';
import type { TicketComment } from '@/types';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function TicketComments({ ticketId, comments }: { ticketId: string; comments: TicketComment[] }) {
  const [content, setContent] = React.useState('');
  const addComment = useAddComment(ticketId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;

    try {
      await addComment.mutateAsync(content.trim());
      setContent('');
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao comentar', description: 'Tente novamente.' });
    }
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum comentário interno ainda.</p>
      )}

      <ul className="space-y-3">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-xs">
                {comment.author ? initials(comment.author.name) : '--'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 rounded-md border border-border bg-muted/30 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{comment.author?.name ?? 'Sistema'}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
            </div>
          </li>
        ))}
      </ul>

      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Escreva um comentário interno..."
          rows={2}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={addComment.isPending || !content.trim()}>
          {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
