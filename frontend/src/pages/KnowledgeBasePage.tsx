import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, LayoutGrid, List, MoreVertical, Plus, Search } from 'lucide-react';
import { useKnowledgeBaseArticles, useDeleteArticle, useDuplicateArticle } from '@/hooks/useKnowledgeBase';
import { knowledgeBaseService, type KnowledgeBaseArticle } from '@/services/knowledgeBaseService';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { canManageKnowledgeBase } from '@/utils/knowledgeBasePermissions';
import { useViewMode } from '@/hooks/useViewMode';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/utils/cn';

export function KnowledgeBasePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = canManageKnowledgeBase(user);

  const [search, setSearch] = React.useState('');
  const { data, isLoading } = useKnowledgeBaseArticles(search);
  const deleteArticle = useDeleteArticle();
  const duplicateArticle = useDuplicateArticle();
  const [viewMode, setViewMode] = useViewMode();

  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = React.useState<string | null>(null);

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    try {
      const full = await knowledgeBaseService.getById(id);
      const created = await duplicateArticle.mutateAsync(full);
      toast({ title: 'Artigo duplicado' });
      navigate(`/base-de-conhecimento/${created.id}/editar`);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao duplicar artigo' });
    } finally {
      setDuplicatingId(null);
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await deleteArticle.mutateAsync(deletingId);
      toast({ title: 'Artigo excluído' });
      setDeletingId(null);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao excluir artigo' });
    }
  }

  function ArticleActionsMenu({ article }: { article: KnowledgeBaseArticle }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
          <DropdownMenuItem onClick={() => navigate(`/base-de-conhecimento/${article.id}`)}>Ver</DropdownMenuItem>
          {canManage && (
            <>
              <DropdownMenuItem onClick={() => navigate(`/base-de-conhecimento/${article.id}/editar`)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={duplicatingId === article.id}
                onClick={() => handleDuplicate(article.id)}
              >
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeletingId(article.id)}
              >
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Base de Conhecimento</h1>
          <p className="text-sm text-muted-foreground">
            Artigos consultados em tempo real na Base de Conhecimento do site Gestão.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => navigate('/base-de-conhecimento/novo')}>
            <Plus className="h-4 w-4" />
            Novo artigo
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar artigos..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
            aria-label="Visualizar em grade"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
            aria-label="Visualizar em lista"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className={cn('grid gap-4', viewMode === 'grid' && 'sm:grid-cols-2')}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <BookOpen className="h-8 w-8" />
            Nenhum artigo encontrado.
          </CardContent>
        </Card>
      )}

      {data && data.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((article) => (
            <Card
              key={article.id}
              className="h-full cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => navigate(`/base-de-conhecimento/${article.id}`)}
            >
              <CardContent className="flex h-full flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium leading-snug">{article.title}</h3>
                  <div className="flex shrink-0 items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <ArticleActionsMenu article={article} />
                  </div>
                </div>
                <p className="flex-1 text-xs text-muted-foreground">{article.summary}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {article.category && <Badge variant="secondary">{article.category}</Badge>}
                  {article.status === 'draft' && <Badge variant="outline">Rascunho</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && data.length > 0 && viewMode === 'list' && (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {data.map((article) => (
              <div
                key={article.id}
                className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
                onClick={() => navigate(`/base-de-conhecimento/${article.id}`)}
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{article.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{article.summary}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {article.category && <Badge variant="secondary">{article.category}</Badge>}
                  {article.status === 'draft' && <Badge variant="outline">Rascunho</Badge>}
                </div>
                <ArticleActionsMenu article={article} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir este artigo?</DialogTitle>
            <DialogDescription>
              O artigo será removido do site imediatamente. Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
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
