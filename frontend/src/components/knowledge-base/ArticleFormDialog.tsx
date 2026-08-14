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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKnowledgeBaseArticle, useKnowledgeBaseCategories, useCreateArticle, useUpdateArticle } from '@/hooks/useKnowledgeBase';
import { toast } from '@/hooks/use-toast';
import type { KnowledgeBaseArticleInput, KnowledgeBaseArticleStatus } from '@/services/knowledgeBaseService';

interface ArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId?: string | null;
}

const EMPTY_FORM = {
  title: '',
  summary: '',
  content: '',
  categoryId: '',
  status: 'draft' as KnowledgeBaseArticleStatus,
  tags: '',
};

function extractErrorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? fallback
  );
}

export function ArticleFormDialog({ open, onOpenChange, articleId }: ArticleFormDialogProps) {
  const isEditing = !!articleId;
  const { data: article } = useKnowledgeBaseArticle(isEditing ? (articleId as string) : null);
  const { data: categories } = useKnowledgeBaseCategories();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle(articleId ?? '');

  const [form, setForm] = React.useState(EMPTY_FORM);

  React.useEffect(() => {
    if (!open) return;
    if (article && isEditing) {
      setForm({
        title: article.title,
        summary: article.summary,
        content: article.content ?? '',
        categoryId: article.categoryId ? String(article.categoryId) : '',
        status: article.status ?? 'draft',
        tags: article.tags?.join(', ') ?? '',
      });
    } else if (!isEditing) {
      setForm(EMPTY_FORM);
    }
  }, [open, article, isEditing]);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const input: KnowledgeBaseArticleInput = {
      title: form.title,
      summary: form.summary,
      content: form.content,
      categoryId: Number(form.categoryId),
      status: form.status,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      if (isEditing) {
        await updateArticle.mutateAsync(input);
        toast({ title: 'Artigo atualizado' });
      } else {
        await createArticle.mutateAsync(input);
        toast({ title: form.status === 'published' ? 'Artigo publicado' : 'Rascunho salvo' });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar artigo',
        description: extractErrorMessage(error, 'Verifique os dados e tente novamente.'),
      });
    }
  }

  const isSubmitting = createArticle.isPending || updateArticle.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar artigo' : 'Novo artigo'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'As alterações refletem no site imediatamente.'
              : 'Publicado aqui, o artigo aparece direto no site Gestão.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="article-title">Título *</Label>
            <Input
              id="article-title"
              required
              minLength={3}
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="article-summary">Resumo *</Label>
            <Textarea
              id="article-summary"
              required
              minLength={5}
              rows={2}
              value={form.summary}
              onChange={(event) => setField('summary', event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="article-content">Conteúdo * (markdown)</Label>
            <Textarea
              id="article-content"
              required
              minLength={10}
              rows={10}
              className="font-mono text-xs"
              value={form.content}
              onChange={(event) => setField('content', event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="article-category">Categoria *</Label>
              <Select value={form.categoryId} onValueChange={(value) => setField('categoryId', value)}>
                <SelectTrigger id="article-category">
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
              <Label htmlFor="article-status">Status</Label>
              <Select value={form.status} onValueChange={(value) => setField('status', value as KnowledgeBaseArticleStatus)}>
                <SelectTrigger id="article-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="article-tags">Tags (separadas por vírgula)</Label>
            <Input id="article-tags" value={form.tags} onChange={(event) => setField('tags', event.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !form.categoryId}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar alterações' : form.status === 'published' ? 'Publicar' : 'Salvar rascunho'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
