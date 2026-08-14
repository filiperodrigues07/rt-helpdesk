import { api } from './api';
import type {
  ApiSuccess,
  CustomerDetail,
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
};
