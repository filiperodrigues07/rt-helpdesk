import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, ExternalLink, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKnowledgeBaseCategories, useImportArticlesPreview } from '@/hooks/useKnowledgeBase';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import type { ImportPreviewItem, KnowledgeBaseArticleStatus } from '@/services/knowledgeBaseService';
import { toast } from '@/hooks/use-toast';

interface DraftItem extends ImportPreviewItem {
  included: boolean;
  categoryId: string;
  status: KnowledgeBaseArticleStatus;
}

function extractErrorMessage(error: unknown, fallback: string) {
  const apiError = (
    error as {
      response?: {
        data?: { error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } } };
      };
    }
  )?.response?.data?.error;

  const firstFieldError = Object.values(apiError?.details?.fieldErrors ?? {})[0]?.[0];
  return firstFieldError ?? apiError?.message ?? fallback;
}

export function KnowledgeBaseImportPage() {
  const navigate = useNavigate();
  const { data: categories } = useKnowledgeBaseCategories();
  const previewMutation = useImportArticlesPreview();

  const [urlsText, setUrlsText] = React.useState('');
  const [defaultCategoryId, setDefaultCategoryId] = React.useState('');
  const [defaultStatus, setDefaultStatus] = React.useState<KnowledgeBaseArticleStatus>('draft');
  const [drafts, setDrafts] = React.useState<DraftItem[]>([]);
  const [importing, setImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState<{ done: number; total: number } | null>(null);

  async function handlePreview(event: React.FormEvent) {
    event.preventDefault();
    const urls = [...new Set(urlsText.split('\n').map((line) => line.trim()).filter(Boolean))];
    if (urls.length === 0) return;

    try {
      const results = await previewMutation.mutateAsync(urls);
      setDrafts(
        results.map((result) => ({
          ...result,
          included: !result.error,
          categoryId: defaultCategoryId,
          status: defaultStatus,
        })),
      );
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao pré-visualizar URLs', description: 'Tente novamente.' });
    }
  }

  function updateDraft<K extends keyof DraftItem>(index: number, key: K, value: DraftItem[K]) {
    setDrafts((prev) => prev.map((draft, i) => (i === index ? { ...draft, [key]: value } : draft)));
  }

  async function handleImport() {
    const toImport = drafts.filter((draft) => draft.included && !draft.error);
    if (toImport.length === 0) return;

    setImporting(true);
    setImportProgress({ done: 0, total: toImport.length });
    let created = 0;
    let failed = 0;

    for (const draft of toImport) {
      if (!draft.categoryId) {
        failed++;
      } else {
        try {
          await knowledgeBaseService.create({
            title: draft.title ?? '',
            summary: draft.summary ?? '',
            content: draft.content ?? '',
            categoryId: Number(draft.categoryId),
            status: draft.status,
            tags: [],
          });
          created++;
        } catch (error) {
          failed++;
          toast({
            variant: 'destructive',
            title: `Erro ao importar "${draft.title}"`,
            description: extractErrorMessage(error, 'Verifique os dados e tente novamente.'),
          });
        }
      }
      setImportProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
    }

    setImporting(false);
    setImportProgress(null);
    toast({
      title: 'Importação concluída',
      description: `${created} artigo(s) importado(s)${failed ? `, ${failed} com erro` : ''}.`,
    });
    if (created > 0) navigate('/base-de-conhecimento');
  }

  const includedCount = drafts.filter((draft) => draft.included && !draft.error).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate('/base-de-conhecimento')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Importar artigos de URL</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">URLs de origem</CardTitle>
          <CardDescription>Cole uma ou mais URLs de artigos/manuais externos, uma por linha.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePreview}>
            <Textarea
              rows={5}
              placeholder={'https://exemplo.com/blog/artigo-1/\nhttps://exemplo.com/blog/artigo-2/'}
              value={urlsText}
              onChange={(event) => setUrlsText(event.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="default-category">Categoria padrão</Label>
                <Select value={defaultCategoryId} onValueChange={setDefaultCategoryId}>
                  <SelectTrigger id="default-category">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="default-status">Status padrão</Label>
                <Select value={defaultStatus} onValueChange={(value) => setDefaultStatus(value as KnowledgeBaseArticleStatus)}>
                  <SelectTrigger id="default-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={previewMutation.isPending || !urlsText.trim()}>
              {previewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Pré-visualizar
            </Button>
          </form>
        </CardContent>
      </Card>

      {drafts.length > 0 && (
        <>
          <div className="space-y-3">
            {drafts.map((draft, index) => (
              <Card key={draft.url}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={draft.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {draft.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {!draft.error && (
                      <Switch
                        checked={draft.included}
                        onCheckedChange={(checked) => updateDraft(index, 'included', checked)}
                      />
                    )}
                  </div>

                  {draft.error ? (
                    <p className="text-sm text-destructive">{draft.error}</p>
                  ) : (
                    <>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Título</Label>
                          <Input
                            value={draft.title ?? ''}
                            onChange={(event) => updateDraft(index, 'title', event.target.value)}
                            disabled={!draft.included}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Categoria</Label>
                            <Select
                              value={draft.categoryId}
                              onValueChange={(value) => updateDraft(index, 'categoryId', value)}
                              disabled={!draft.included}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories?.map((category) => (
                                  <SelectItem key={category.id} value={String(category.id)}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Status</Label>
                            <Select
                              value={draft.status}
                              onValueChange={(value) => updateDraft(index, 'status', value as KnowledgeBaseArticleStatus)}
                              disabled={!draft.included}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Rascunho</SelectItem>
                                <SelectItem value="published">Publicado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Resumo</Label>
                        <Textarea
                          rows={2}
                          value={draft.summary ?? ''}
                          onChange={(event) => updateDraft(index, 'summary', event.target.value)}
                          disabled={!draft.included}
                        />
                      </div>

                      <details className="rounded-md border border-border">
                        <summary className="cursor-pointer px-3 py-2 text-sm text-muted-foreground">
                          Pré-visualizar conteúdo
                        </summary>
                        <div className="prose-kb border-t border-border p-3">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.content ?? ''}</ReactMarkdown>
                        </div>
                      </details>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-end gap-4">
            {importProgress && (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Progress value={(importProgress.done / importProgress.total) * 100} className="max-w-xs" />
                <p className="shrink-0 text-xs text-muted-foreground">
                  {importProgress.done} de {importProgress.total}
                </p>
              </div>
            )}
            <Button onClick={handleImport} disabled={importing || includedCount === 0}>
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              Importar {includedCount > 0 ? `(${includedCount})` : ''}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
