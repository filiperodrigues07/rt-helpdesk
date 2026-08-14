import { api } from './api';
import type { ApiSuccess, Category, Tag } from '@/types';

export const categoryService = {
  async list() {
    const { data } = await api.get<ApiSuccess<Category[]>>('/categories');
    return data.data;
  },
};

export const tagService = {
  async list() {
    const { data } = await api.get<ApiSuccess<Tag[]>>('/tags');
    return data.data;
  },
};
