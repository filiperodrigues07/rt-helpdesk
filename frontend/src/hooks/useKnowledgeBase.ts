import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { knowledgeBaseService, type KnowledgeBaseArticleInput } from '@/services/knowledgeBaseService';

export function useKnowledgeBaseArticles(query?: string) {
  return useQuery({
    queryKey: ['knowledge-base', 'list', query],
    queryFn: () => knowledgeBaseService.search(query || undefined),
  });
}

export function useKnowledgeBaseArticle(id: string | null) {
  return useQuery({
    queryKey: ['knowledge-base', 'detail', id],
    queryFn: () => knowledgeBaseService.getById(id as string),
    enabled: !!id,
  });
}

export function useKnowledgeBaseCategories() {
  return useQuery({
    queryKey: ['knowledge-base', 'categories'],
    queryFn: knowledgeBaseService.listCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: KnowledgeBaseArticleInput) => knowledgeBaseService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });
}

export function useUpdateArticle(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<KnowledgeBaseArticleInput>) => knowledgeBaseService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => knowledgeBaseService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });
}
