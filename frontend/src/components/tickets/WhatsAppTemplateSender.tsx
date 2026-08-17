import * as React from 'react';
import { FileText, ImagePlus, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useWhatsAppTemplate, useWhatsAppTemplates } from '@/hooks/useTicket';
import { useSendWhatsAppTemplate, useUploadTemplateHeaderImage } from '@/hooks/useTicketMutations';
import { toast } from '@/hooks/use-toast';
import {
  buildSendComponents,
  isTemplateFormComplete,
  parseTemplateComponents,
  type TemplateFormValues,
} from '@/utils/whatsappTemplate';

const EMPTY_VALUES: TemplateFormValues = { headerTextValues: [], bodyValues: [], buttonValues: {} };

function extractErrorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? fallback
  );
}

export function WhatsAppTemplateSender({ ticketId }: { ticketId: string }) {
  const [open, setOpen] = React.useState(false);
  const [templateId, setTemplateId] = React.useState<string>('');
  const [values, setValues] = React.useState<TemplateFormValues>(EMPTY_VALUES);
  const [headerImagePreview, setHeaderImagePreview] = React.useState<string | null>(null);
  const headerImageInputRef = React.useRef<HTMLInputElement>(null);

  const { data: templatesResult, isLoading: templatesLoading, error: templatesError } = useWhatsAppTemplates(
    ticketId,
    open,
  );
  const { data: template, isLoading: templateLoading } = useWhatsAppTemplate(ticketId, templateId || undefined);
  const uploadHeaderImage = useUploadTemplateHeaderImage(ticketId);
  const sendTemplate = useSendWhatsAppTemplate(ticketId);

  const parsed = React.useMemo(() => (template ? parseTemplateComponents(template.components) : null), [template]);

  function resetForm() {
    setTemplateId('');
    setValues(EMPTY_VALUES);
    setHeaderImagePreview(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  async function handleHeaderImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setHeaderImagePreview(URL.createObjectURL(file));
    try {
      const url = await uploadHeaderImage.mutateAsync(file);
      setValues((prev) => ({ ...prev, headerImageUrl: url }));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar imagem',
        description: extractErrorMessage(error, 'Tente novamente.'),
      });
      setHeaderImagePreview(null);
    }
  }

  async function handleSend() {
    if (!template || !parsed) return;
    try {
      await sendTemplate.mutateAsync({
        templateName: template.name,
        language: template.language,
        components: buildSendComponents(parsed, values),
      });
      toast({ title: 'Template enviado' });
      handleOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar template',
        description: extractErrorMessage(error, 'Tente novamente.'),
      });
    }
  }

  const templates = templatesResult?.data ?? [];
  const canSend = !!parsed && isTemplateFormComplete(parsed, values);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4" />
        Enviar template
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar template do WhatsApp</DialogTitle>
            <DialogDescription>
              Use um template aprovado pra reabrir a conversa fora da janela de 24h.
            </DialogDescription>
          </DialogHeader>

          {templatesLoading && <Skeleton className="h-9 w-full" />}

          {templatesError && (
            <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              {extractErrorMessage(templatesError, 'Não foi possível carregar os templates.')}
            </p>
          )}

          {!templatesLoading && !templatesError && templates.length === 0 && (
            <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Nenhum template encontrado.
            </p>
          )}

          {!templatesLoading && !templatesError && templates.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="template-select">Template</Label>
                <Select
                  value={templateId}
                  onValueChange={(value) => {
                    setTemplateId(value);
                    setValues(EMPTY_VALUES);
                    setHeaderImagePreview(null);
                  }}
                >
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((tpl) => (
                      <SelectItem key={tpl.id} value={tpl.id} disabled={tpl.status !== 'APPROVED'}>
                        {tpl.name} ({tpl.language}) — {tpl.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {templateLoading && <Skeleton className="h-32 w-full" />}

              {parsed && (
                <div className="space-y-4 rounded-md border border-border p-3">
                  {parsed.header?.format === 'IMAGE' && (
                    <div className="space-y-1.5">
                      <Label>Imagem do cabeçalho</Label>
                      <input
                        ref={headerImageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        className="hidden"
                        onChange={handleHeaderImageSelect}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadHeaderImage.isPending}
                        onClick={() => headerImageInputRef.current?.click()}
                      >
                        {uploadHeaderImage.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ImagePlus className="h-3.5 w-3.5" />
                        )}
                        {values.headerImageUrl ? 'Trocar imagem' : 'Selecionar imagem'}
                      </Button>
                      {headerImagePreview && (
                        <img src={headerImagePreview} alt="Prévia do cabeçalho" className="mt-2 max-h-32 rounded-md" />
                      )}
                    </div>
                  )}

                  {parsed.header?.format === 'TEXT' &&
                    Array.from({ length: parsed.header.variableCount }, (_, i) => (
                      <div key={`header-${i}`} className="space-y-1.5">
                        <Label htmlFor={`header-var-${i}`}>Cabeçalho — variável {i + 1}</Label>
                        <Input
                          id={`header-var-${i}`}
                          value={values.headerTextValues[i] ?? ''}
                          onChange={(event) =>
                            setValues((prev) => {
                              const headerTextValues = [...prev.headerTextValues];
                              headerTextValues[i] = event.target.value;
                              return { ...prev, headerTextValues };
                            })
                          }
                        />
                      </div>
                    ))}

                  {parsed.body &&
                    Array.from({ length: parsed.body.variableCount }, (_, i) => (
                      <div key={`body-${i}`} className="space-y-1.5">
                        <Label htmlFor={`body-var-${i}`}>Variável {i + 1}</Label>
                        <Input
                          id={`body-var-${i}`}
                          placeholder={parsed.body?.placeholders[i]}
                          value={values.bodyValues[i] ?? ''}
                          onChange={(event) =>
                            setValues((prev) => {
                              const bodyValues = [...prev.bodyValues];
                              bodyValues[i] = event.target.value;
                              return { ...prev, bodyValues };
                            })
                          }
                        />
                      </div>
                    ))}

                  {parsed.buttons.map((btn) => (
                    <div key={`button-${btn.index}`} className="space-y-1.5">
                      <Label htmlFor={`button-var-${btn.index}`}>Botão "{btn.text}"</Label>
                      <Input
                        id={`button-var-${btn.index}`}
                        placeholder={btn.placeholder}
                        value={values.buttonValues[btn.index] ?? ''}
                        onChange={(event) =>
                          setValues((prev) => ({
                            ...prev,
                            buttonValues: { ...prev.buttonValues, [btn.index]: event.target.value },
                          }))
                        }
                      />
                    </div>
                  ))}

                  {!parsed.header && !parsed.body && parsed.buttons.length === 0 && (
                    <p className="text-xs text-muted-foreground">Este template não tem variáveis pra preencher.</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSend} disabled={!canSend || sendTemplate.isPending}>
                  {sendTemplate.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
