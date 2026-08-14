import { reportRepository, ReportFilters } from '../repositories/reportRepository';

export const reportService = {
  summary(filters: ReportFilters) {
    return reportRepository.summary(filters);
  },

  async listForExport(filters: ReportFilters) {
    const tickets = await reportRepository.listForExport(filters);
    return tickets.map((ticket) => ({
      number: ticket.number,
      title: ticket.title,
      cliente: ticket.customer.tradeName ?? ticket.customer.companyName,
      responsavel: ticket.assignee?.name ?? '',
      categoria: ticket.category?.name ?? '',
      prioridade: ticket.priority,
      status: ticket.status,
      origem: ticket.origin,
      abertoEm: ticket.createdAt.toISOString(),
      resolvidoEm: ticket.resolvedAt?.toISOString() ?? '',
    }));
  },
};
