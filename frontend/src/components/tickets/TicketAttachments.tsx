import * as React from 'react';
import { FileText, Loader2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadAttachment } from '@/hooks/useTicketMutations';
import { toast } from '@/hooks/use-toast';
import type { TicketAttachment } from '@/types';

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api').replace(/\/api\/?$/, '');

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TicketAttachments({ ticketId, attachments }: { ticketId: string; attachments: TicketAttachment[] }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const upload = useUploadAttachment(ticketId);

  async function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    for (const file of files) {
      try {
        await upload.mutateAsync(file);
      } catch {
        toast({ variant: 'destructive', title: `Falha ao anexar ${file.name}` });
      }
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        onChange={handleSelect}
      />

      {attachments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum anexo.</p>}

      <ul className="space-y-1.5">
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <a
              href={`${API_ORIGIN}${attachment.fileUrl}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-sm hover:border-primary/40"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatSize(attachment.sizeBytes)}</span>
            </a>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        Anexar arquivo
      </Button>
    </div>
  );
}
