import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customerService';

export function useCustomers() {
  return useQuery({ queryKey: ['customers', 'minimal'], queryFn: customerService.listMinimal });
}

export function useCustomerList(params: { page?: number; pageSize?: number; search?: string }) {
  return useQuery({
    queryKey: ['customers', 'list', params],
    queryFn: () => customerService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customers', 'detail', id],
    queryFn: () => customerService.getById(id as string),
    enabled: !!id,
  });
}
