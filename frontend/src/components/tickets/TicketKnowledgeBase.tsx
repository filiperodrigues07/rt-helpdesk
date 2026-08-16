import * as React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Lightbulb, Search } from 'lucide-react';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const QUERY_MAX_LENGTH = 80;

export function TicketKnowledgeBase({ query }: { query: string }) {
  const truncatedQuery = query.length > QUERY_MAX_LENGTH ? `${query.slice(0, QUERY_MAX_LENGTH).trim()}...` : query;
  const [search, setSearch] = React.useState(truncatedQuery);
  const [activeQuery, setActiveQuery] = React.useState(truncatedQuery);

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-base', 'ticket-related', activeQuery],
    queryFn: () => knowledgeBaseService.search(activeQuery),
    enabled: activeQuery.trim().length > 0,
  });

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setActiveQuery(search);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Lightbulb className="h-4 w-4 text-primary" />
        Base de Conhecimento
      </div>

      <form className="flex gap-1.5" onSubmit={handleSearch}>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar artigos..."
          className="h-8 text-xs"
        />
        <Button type="submit" size="icon" variant="outline" className="h-8 w-8 shrink-0">
          <Search className="h-3.5 w-3.5" />
        </Button>
      </form>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {data && data.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhum artigo relacionado encontrado.</p>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-1.5">
          {data.slice(0, 4).map((article) => (
            <li key={article.id}>
              <Link
                to={`/base-de-conhecimento/${article.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-start justify-between gap-2 rounded-md border border-border px-2.5 py-2 text-xs hover:border-primary/40"
              >
                <span className="min-w-0 flex-1 truncate">{article.title}</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
