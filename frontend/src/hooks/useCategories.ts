import { useQuery } from '@tanstack/react-query';
import { categoryService, tagService } from '@/services/categoryService';

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: categoryService.list });
}

export function useTags() {
  return useQuery({ queryKey: ['tags'], queryFn: tagService.list });
}
