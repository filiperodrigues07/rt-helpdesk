import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ExternalLink, Loader2, Pencil, Copy, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useKnowledgeBaseArticle } from '@/hooks/useKnowledgeBase';
import { useDuplicateArticle, useDeleteArticle } from '@/hooks/useKnowledgeBase';
import { useAuth } from '@/contexts/AuthContext';
import { canManageKnowledgeBase } from '@/utils/knowledgeBasePermissions';
import { toast } from '@/hooks/use-toast';

function resolveMarkdownImage(src: string | undefined, articleUrl: string): string | undefined {
  if (!src || !src.startsWith('/')) return src;
  return `${new URL(articleUrl).origin}${src}`;
}

export function KnowledgeBaseArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = canManageKnowledgeBase(user);

  const { data: article, isLoading } = useKnowledgeBaseArticle(id ?? null);
  const duplicateArticle = useDuplicateArticle();
  const deleteArticle = useDeleteArticle();
  const [deleting, setDeleting] = React.useState(false);

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
    if (!article) return;
    try {
      await deleteArticle.mutateAsync(article.id);
      toast({ title: 'Artigo excluído' });
      navigate('/base-de-conhecimento');
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao excluir artigo' });
    }
  }

  if (isLoading || !article) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/base-de-conhecimento')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{article.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {article.category && <Badge variant="secondary">{article.category}</Badge>}
            {article.status === 'draft' && <Badge variant="outline">Rascunho</Badge>}
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/base-de-conhecimento/${article.id}/editar`)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="prose-kb">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ src, alt }) => (
                  <img src={resolveMarkdownImage(src as string, article.url)} alt={alt} className="rounded-md" />
                ),
              }}
            >
              {article.content ?? ''}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <a href={article.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            Ver no site
          </a>
          <span>Atualizado em {format(new Date(article.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={duplicateArticle.isPending}>
              {duplicateArticle.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
              Duplicar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleting(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </Button>
          </div>
        )}
      </div>

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir "{article.title}"?</DialogTitle>
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
