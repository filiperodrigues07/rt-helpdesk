import * as React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useReopenTicket } from '@/hooks/useTicketMutations';
import { toast } from '@/hooks/use-toast';

interface ReopenTicketDialogProps {
  ticketId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReopenTicketDialog({ ticketId, open, onOpenChange }: ReopenTicketDialogProps) {
  const [reason, setReason] = React.useState('');
  const reopenMutation = useReopenTicket(ticketId);

  React.useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  async function handleConfirm() {
    try {
      await reopenMutation.mutateAsync({ reason: reason || undefined });
      toast({ title: 'Chamado reaberto' });
      onOpenChange(false);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao reabrir', description: 'Tente novamente.' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reabrir chamado</DialogTitle>
          <DialogDescription>
            O chamado volta para Em andamento. A solução atual fica arquivada no histórico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="reopenReason">Motivo da reabertura (opcional)</Label>
          <Textarea
            id="reopenReason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Por que o chamado está sendo reaberto?"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={reopenMutation.isPending}>
            {reopenMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Reabrir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
