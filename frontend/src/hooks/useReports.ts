import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import type { ReportFilters } from '@/types';

export function useReportSummary(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'summary', filters],
    queryFn: () => reportService.summary(filters),
  });
}
