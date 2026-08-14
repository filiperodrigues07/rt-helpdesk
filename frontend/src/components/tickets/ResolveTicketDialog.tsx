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
import { useResolveTicket } from '@/hooks/useTicketMutations';
import { toast } from '@/hooks/use-toast';

interface ResolveTicketDialogProps {
  ticketId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: 'RESOLVIDO' | 'ENCERRADO';
  onResolved?: () => void;
}

export function ResolveTicketDialog({ ticketId, open, onOpenChange, status, onResolved }: ResolveTicketDialogProps) {
  const [resolvedProblem, setResolvedProblem] = React.useState('');
  const [rootCause, setRootCause] = React.useState('');
  const [appliedSolution, setAppliedSolution] = React.useState('');
  const [observations, setObservations] = React.useState('');

  const resolveMutation = useResolveTicket(ticketId);

  React.useEffect(() => {
    if (!open) {
      setResolvedProblem('');
      setRootCause('');
      setAppliedSolution('');
      setObservations('');
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await resolveMutation.mutateAsync({
        status,
        resolvedProblem,
        rootCause,
        appliedSolution,
        observations: observations || undefined,
      });
      toast({ title: status === 'ENCERRADO' ? 'Chamado encerrado' : 'Chamado resolvido' });
      onOpenChange(false);
      onResolved?.();
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Tente novamente.' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{status === 'ENCERRADO' ? 'Encerrar chamado' : 'Resolver chamado'}</DialogTitle>
          <DialogDescription>
            Preencha as informações da solução antes de {status === 'ENCERRADO' ? 'encerrar' : 'marcar como resolvido'}.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="resolvedProblem">Problema identificado</Label>
            <Textarea
              id="resolvedProblem"
              required
              value={resolvedProblem}
              onChange={(event) => setResolvedProblem(event.target.value)}
              placeholder="O que aconteceu?"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rootCause">Causa raiz</Label>
            <Textarea
              id="rootCause"
              required
              value={rootCause}
              onChange={(event) => setRootCause(event.target.value)}
              placeholder="Por que aconteceu?"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appliedSolution">Solução aplicada</Label>
            <Textarea
              id="appliedSolution"
              required
              value={appliedSolution}
              onChange={(event) => setAppliedSolution(event.target.value)}
              placeholder="Como foi solucionado?"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observations">Observações (opcional)</Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(event) => setObservations(event.target.value)}
              placeholder="Informações adicionais"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={resolveMutation.isPending}>
              {resolveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === 'ENCERRADO' ? 'Encerrar' : 'Resolver'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
