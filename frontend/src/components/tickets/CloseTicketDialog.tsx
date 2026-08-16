import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCloseTicket } from '@/hooks/useTicketMutations';
import { toast } from '@/hooks/use-toast';

interface CloseTicketDialogProps {
  ticketId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseTicketDialog({ ticketId, open, onOpenChange }: CloseTicketDialogProps) {
  const closeMutation = useCloseTicket(ticketId);

  async function handleConfirm() {
    try {
      await closeMutation.mutateAsync();
      toast({ title: 'Chamado encerrado' });
      onOpenChange(false);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao encerrar', description: 'Tente novamente.' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Encerrar chamado</DialogTitle>
          <DialogDescription>
            O chamado será marcado como encerrado. A solução já registrada continua disponível.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={closeMutation.isPending}>
            {closeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Encerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
