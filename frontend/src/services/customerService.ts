import { api } from './api';
import type {
  ApiSuccess,
  CustomerDetail,
  CustomerImportResult,
  CustomerInput,
  CustomerListItem,
  CustomerOption,
  PaginatedResult,
} from '@/types';

export const customerService = {
  async listMinimal() {
    const { data } = await api.get<ApiSuccess<CustomerOption[]>>('/customers/minimal');
    return data.data;
  },

  async list(params: { page?: number; pageSize?: number; search?: string }) {
    const { data } = await api.get<ApiSuccess<PaginatedResult<CustomerListItem>>>('/customers', { params });
    return data.data;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiSuccess<CustomerDetail>>(`/customers/${id}`);
    return data.data;
  },

  async create(input: CustomerInput) {
    const { data } = await api.post<ApiSuccess<CustomerDetail>>('/customers', input);
    return data.data;
  },

  async update(id: string, input: Partial<CustomerInput>) {
    const { data } = await api.patch<ApiSuccess<CustomerDetail>>(`/customers/${id}`, input);
    return data.data;
  },

  async remove(id: string) {
    await api.delete<ApiSuccess<{ success: boolean }>>(`/customers/${id}`);
  },

  async importBatch(rows: CustomerInput[]) {
    const { data } = await api.post<ApiSuccess<CustomerImportResult>>('/customers/import', { rows });
    return data.data;
  },

  async exportAll() {
    const pageSize = 100;
    const all: CustomerListItem[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const { data } = await api.get<ApiSuccess<PaginatedResult<CustomerListItem>>>('/customers', {
        params: { page, pageSize },
      });
      all.push(...data.data.items);
      totalPages = data.data.pagination.totalPages;
      page++;
    } while (page <= totalPages);

    return all;
  },
};
