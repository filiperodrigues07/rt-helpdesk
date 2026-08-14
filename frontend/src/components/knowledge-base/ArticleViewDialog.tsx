import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useKnowledgeBaseArticle } from '@/hooks/useKnowledgeBase';

interface ArticleViewDialogProps {
  articleId: string | null;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function resolveMarkdownImage(src: string | undefined, articleUrl: string): string | undefined {
  if (!src || !src.startsWith('/')) return src;
  return `${new URL(articleUrl).origin}${src}`;
}

export function ArticleViewDialog({ articleId, onOpenChange, canManage, onEdit, onDelete }: ArticleViewDialogProps) {
  const { data: article, isLoading } = useKnowledgeBaseArticle(articleId);

  return (
    <Dialog open={!!articleId} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {isLoading || !article ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                {article.category && <Badge variant="secondary">{article.category}</Badge>}
                {article.status === 'draft' && <Badge variant="outline">Rascunho</Badge>}
              </div>
              <DialogTitle className="text-lg">{article.title}</DialogTitle>
            </DialogHeader>

            <div className="prose-kb text-sm leading-relaxed text-foreground">
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

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver no site
              </a>

              {canManage && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(article.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(article.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
