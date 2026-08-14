import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Lightbulb } from 'lucide-react';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { Skeleton } from '@/components/ui/skeleton';

export function TicketKnowledgeBase({ query }: { query: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-base', 'ticket-related', query],
    queryFn: () => knowledgeBaseService.search(query),
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Lightbulb className="h-4 w-4 text-primary" />
        Base de Conhecimento
      </div>

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
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start justify-between gap-2 rounded-md border border-border px-2.5 py-2 text-xs hover:border-primary/40"
              >
                <span className="min-w-0 flex-1 truncate">{article.title}</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
