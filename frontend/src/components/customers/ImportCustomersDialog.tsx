import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { parseCsv } from '@/utils/csv';
import { buildHeaderMap, rowToCustomerInput } from '@/utils/customerImport';
import { customerService } from '@/services/customerService';
import { toast } from '@/hooks/use-toast';
import type { CustomerImportResult, CustomerInput } from '@/types';

interface ImportCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELD_LABELS: Record<keyof CustomerInput, string> = {
  companyName: 'Razão social',
  tradeName: 'Nome fantasia',
  cnpj: 'CNPJ',
  phone: 'Telefone',
  email: 'E-mail',
  city: 'Cidade',
  notes: 'Observações',
};

export function ImportCustomersDialog({ open, onOpenChange }: ImportCustomersDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = React.useState('');
  const [rows, setRows] = React.useState<CustomerInput[]>([]);
  const [headerMap, setHeaderMap] = React.useState<Partial<Record<keyof CustomerInput, string>>>({});
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<CustomerImportResult | null>(null);

  function reset() {
    setFileName('');
    setRows([]);
    setHeaderMap({});
    setResult(null);
  }

  React.useEffect(() => {
    if (!open) reset();
  }, [open]);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const { headers, rows: parsedRows } = parseCsv(text);
      const map = buildHeaderMap(headers);
      setHeaderMap(map);
      setRows(parsedRows.map((row) => rowToCustomerInput(row, map)));
    };
    reader.readAsText(file, 'utf-8');
  }

  async function handleImport() {
    setImporting(true);
    try {
      const validRows = rows.filter((row) => row.companyName.trim().length >= 2);
      const importResult = await customerService.importBatch(validRows);
      setResult(importResult);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao importar', description: 'Tente novamente.' });
    } finally {
      setImporting(false);
    }
  }

  const missingCompanyName = !headerMap.companyName;
  const validRowCount = rows.filter((row) => row.companyName.trim().length >= 2).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar clientes (CSV)</DialogTitle>
          <DialogDescription>
            Aceita CSV exportado do Excel ou do próprio RT HELPDESK. Colunas reconhecidas: Razão social, Nome
            fantasia, CNPJ, Telefone, E-mail, Cidade, Observações — os nomes podem variar (com ou sem acento).
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-4">
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              {fileName || 'Selecionar arquivo CSV'}
            </Button>

            {rows.length > 0 && (
              <>
                {missingCompanyName ? (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Não encontrei uma coluna de razão social/nome no arquivo. Verifique o cabeçalho do CSV.
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {validRowCount} de {rows.length} linha(s) prontas para importar.
                    {rows.length > validRowCount && ` ${rows.length - validRowCount} sem razão social serão ignoradas.`}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(FIELD_LABELS) as (keyof CustomerInput)[]).map((field) => (
                    <span
                      key={field}
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        headerMap[field] ? 'border-success/40 text-success' : 'border-border text-muted-foreground'
                      }`}
                    >
                      {FIELD_LABELS[field]}
                      {headerMap[field] ? ` ← "${headerMap[field]}"` : ' (não encontrada)'}
                    </span>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 text-left text-muted-foreground">
                      <tr>
                        <th className="px-2 py-1.5">Razão social</th>
                        <th className="px-2 py-1.5">CNPJ</th>
                        <th className="px-2 py-1.5">Telefone</th>
                        <th className="px-2 py-1.5">Cidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="px-2 py-1.5">{row.companyName || '—'}</td>
                          <td className="px-2 py-1.5">{row.cnpj || '—'}</td>
                          <td className="px-2 py-1.5">{row.phone || '—'}</td>
                          <td className="px-2 py-1.5">{row.city || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 5 && (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">
                      + {rows.length - 5} linha(s) adicionais
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" disabled={validRowCount === 0 || importing} onClick={handleImport}>
                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                Importar {validRowCount > 0 ? `(${validRowCount})` : ''}
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 p-3 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {result.created} cliente(s) importado(s) com sucesso.
            </div>

            {result.skipped.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{result.skipped.length} linha(s) ignorada(s):</p>
                <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <tbody>
                      {result.skipped.map((item) => (
                        <tr key={item.row} className="border-b border-border last:border-0">
                          <td className="px-2 py-1.5 text-muted-foreground">Linha {item.row}</td>
                          <td className="px-2 py-1.5">{item.name}</td>
                          <td className="px-2 py-1.5 text-muted-foreground">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={reset}>
                Importar outro arquivo
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
