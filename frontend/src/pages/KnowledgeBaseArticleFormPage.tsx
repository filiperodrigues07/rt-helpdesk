import * as React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, Loader2, Copy, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MarkdownEditor } from '@/components/knowledge-base/MarkdownEditor';
import {
  useKnowledgeBaseArticle,
  useKnowledgeBaseCategories,
  useCreateArticle,
  useUpdateArticle,
  useDuplicateArticle,
  useDeleteArticle,
} from '@/hooks/useKnowledgeBase';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { useAuth } from '@/contexts/AuthContext';
import { canManageKnowledgeBase } from '@/utils/knowledgeBasePermissions';
import { toast } from '@/hooks/use-toast';
import type { KnowledgeBaseArticleInput, KnowledgeBaseArticleStatus } from '@/services/knowledgeBaseService';

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

export function KnowledgeBaseArticleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = canManageKnowledgeBase(user);

  const { data: article, isLoading } = useKnowledgeBaseArticle(isEditing ? (id as string) : null);
  const { data: categories } = useKnowledgeBaseCategories();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle(id ?? '');
  const duplicateArticle = useDuplicateArticle();
  const deleteArticle = useDeleteArticle();

  const [form, setForm] = React.useState(EMPTY_FORM);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (article && isEditing) {
      setForm({
        title: article.title,
        summary: article.summary,
        content: article.content ?? '',
        categoryId: article.categoryId ? String(article.categoryId) : '',
        status: article.status ?? 'draft',
        tags: article.tags?.join(', ') ?? '',
      });
    }
  }, [article, isEditing]);

  if (!canManage) {
    return <Navigate to="/base-de-conhecimento" replace />;
  }

  if (isEditing && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

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
        navigate(`/base-de-conhecimento/${id}`);
      } else {
        const created = await createArticle.mutateAsync(input);
        toast({ title: form.status === 'published' ? 'Artigo publicado' : 'Rascunho salvo' });
        navigate(`/base-de-conhecimento/${created.id}`);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar artigo',
        description: extractErrorMessage(error, 'Verifique os dados e tente novamente.'),
      });
    }
  }

  async function handleDuplicate() {
    if (!article) return;
    try {
      const created = await duplicateArticle.mutateAsync(article);
      toast({ title: 'Artigo duplicado' });
      navigate(`/base-de-conhecimento/${created.id}/editar`);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao duplicar artigo' });
    }
  }

  async function confirmDelete() {
    if (!id) return;
    try {
      await deleteArticle.mutateAsync(id);
      toast({ title: 'Artigo excluído' });
      navigate('/base-de-conhecimento');
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao excluir artigo' });
    }
  }

  const isSubmitting = createArticle.isPending || updateArticle.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate(isEditing ? `/base-de-conhecimento/${id}` : '/base-de-conhecimento')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">{isEditing ? 'Editar artigo' : 'Novo artigo'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Dados do artigo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="article-title">Título *</Label>
                  <Input
                    id="article-title"
                    required
                    minLength={3}
                    maxLength={160}
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
                    maxLength={300}
                    rows={2}
                    value={form.summary}
                    onChange={(event) => setField('summary', event.target.value)}
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
                    <Label htmlFor="article-tags">Tags</Label>
                    <Input
                      id="article-tags"
                      placeholder="separadas por vírgula"
                      value={form.tags}
                      onChange={(event) => setField('tags', event.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Conteúdo</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownEditor
                  value={form.content}
                  onChange={(value) => setField('content', value)}
                  onUploadImage={knowledgeBaseService.uploadImage}
                  disabled={isSubmitting}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Publicação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="article-status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) => setField('status', value as KnowledgeBaseArticleStatus)}
                  >
                    <SelectTrigger id="article-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || !form.categoryId}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isEditing ? 'Salvar alterações' : form.status === 'published' ? 'Publicar' : 'Salvar rascunho'}
                </Button>

                {isEditing && article && (
                  <p className="text-xs text-muted-foreground">
                    Atualizado em {format(new Date(article.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </CardContent>
            </Card>

            {isEditing && (
              <Card>
                <CardContent className="space-y-2 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleDuplicate}
                    disabled={duplicateArticle.isPending}
                  >
                    {duplicateArticle.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Duplicar artigo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => setDeleting(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir artigo
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir "{article?.title}"?</DialogTitle>
            <DialogDescription>
              O artigo será removido do site imediatamente. Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={deleteArticle.isPending} onClick={confirmDelete}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
