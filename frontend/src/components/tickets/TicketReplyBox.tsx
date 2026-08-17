import * as React from 'react';
import { Loader2, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AttachmentPicker } from '@/components/tickets/AttachmentPicker';
import { WhatsAppTemplateSender } from '@/components/tickets/WhatsAppTemplateSender';
import { useSendTicketMessage } from '@/hooks/useTicketMutations';
import { toast } from '@/hooks/use-toast';

function extractErrorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? fallback
  );
}

export function TicketReplyBox({ ticketId, hasKnownContact }: { ticketId: string; hasKnownContact: boolean }) {
  const [content, setContent] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const sendMessage = useSendTicketMessage(ticketId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim() && files.length === 0) return;

    try {
      await sendMessage.mutateAsync({ content: content.trim() || undefined, files });
      setContent('');
      setFiles([]);
      toast({ title: 'Mensagem enviada' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar mensagem',
        description: extractErrorMessage(error, 'Tente novamente.'),
      });
    }
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <form className="space-y-2" onSubmit={handleSubmit}>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Responder ao cliente..."
          rows={2}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <AttachmentPicker files={files} onChange={setFiles} />

          <div className="flex items-center gap-2">
            {hasKnownContact && <WhatsAppTemplateSender ticketId={ticketId} />}
            <Button
              type="submit"
              size="sm"
              disabled={sendMessage.isPending || (!content.trim() && files.length === 0)}
            >
              {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
