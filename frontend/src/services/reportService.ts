import { api } from './api';
import type { ApiSuccess, ReportFilters, ReportSummary, ReportTicketRow } from '@/types';

export const reportService = {
  async summary(filters: ReportFilters) {
    const { data } = await api.get<ApiSuccess<ReportSummary>>('/reports/summary', { params: filters });
    return data.data;
  },

  async tickets(filters: ReportFilters) {
    const { data } = await api.get<ApiSuccess<ReportTicketRow[]>>('/reports/tickets', { params: filters });
    return data.data;
  },
};
