import * as React from 'react';
import { BookOpen, FileText, Plus, Search } from 'lucide-react';
import { useKnowledgeBaseArticles, useDeleteArticle } from '@/hooks/useKnowledgeBase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ArticleViewDialog } from '@/components/knowledge-base/ArticleViewDialog';
import { ArticleFormDialog } from '@/components/knowledge-base/ArticleFormDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const CAN_MANAGE_ROLES = ['ADMINISTRADOR', 'GERENTE'];

export function KnowledgeBasePage() {
  const { user } = useAuth();
  const canManage = !!user && CAN_MANAGE_ROLES.includes(user.role);

  const [search, setSearch] = React.useState('');
  const { data, isLoading } = useKnowledgeBaseArticles(search);
  const deleteArticle = useDeleteArticle();

  const [viewingId, setViewingId] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(id: string) {
    setViewingId(null);
    setEditingId(id);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await deleteArticle.mutateAsync(deletingId);
      toast({ title: 'Artigo excluído' });
      setDeletingId(null);
      setViewingId(null);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao excluir artigo' });
    }
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
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo artigo
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar artigos..."
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
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

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((article) => (
            <Card
              key={article.id}
              className="h-full cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => setViewingId(article.id)}
            >
              <CardContent className="flex h-full flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium leading-snug">{article.title}</h3>
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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

      <ArticleViewDialog
        articleId={viewingId}
        onOpenChange={(open) => !open && setViewingId(null)}
        canManage={canManage}
        onEdit={openEdit}
        onDelete={setDeletingId}
      />

      <ArticleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        articleId={editingId}
      />

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
