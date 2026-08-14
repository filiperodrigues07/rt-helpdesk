import { api } from './api';
import type { ApiSuccess, DashboardSummary } from '@/types';

export const dashboardService = {
  async summary() {
    const { data } = await api.get<ApiSuccess<DashboardSummary>>('/dashboard/summary');
    return data.data;
  },
};
