import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ExternalLink, Search } from 'lucide-react';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function KnowledgeBasePage() {
  const [search, setSearch] = React.useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-base', search],
    queryFn: () => knowledgeBaseService.search(search || undefined),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Base de Conhecimento</h1>
        <p className="text-sm text-muted-foreground">
          Artigos consultados a partir da Base de Conhecimento existente. No momento, exibindo dados
          mockados — a integração real com a API externa será conectada futuramente.
        </p>
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
            <a key={article.id} href={article.url} target="_blank" rel="noreferrer">
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardContent className="flex h-full flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium leading-snug">{article.title}</h3>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="flex-1 text-xs text-muted-foreground">{article.summary}</p>
                  {article.category && <Badge variant="secondary">{article.category}</Badge>}
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
