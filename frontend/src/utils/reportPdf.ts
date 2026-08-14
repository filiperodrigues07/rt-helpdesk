import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReportFilters, ReportSummary } from '@/types';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/utils/ticketLabels';

interface FilterLabelContext {
  customerName?: string;
  assigneeName?: string;
  categoryName?: string;
}

function buildFilterDescription(filters: ReportFilters, ctx: FilterLabelContext): string {
  const parts: string[] = [];

  if (filters.start || filters.end) {
    const start = filters.start ? format(new Date(filters.start), 'dd/MM/yyyy', { locale: ptBR }) : '...';
    const end = filters.end ? format(new Date(filters.end), 'dd/MM/yyyy', { locale: ptBR }) : '...';
    parts.push(`Período: ${start} a ${end}`);
  }
  if (ctx.customerName) parts.push(`Cliente: ${ctx.customerName}`);
  if (ctx.assigneeName) parts.push(`Responsável: ${ctx.assigneeName}`);
  if (ctx.categoryName) parts.push(`Categoria: ${ctx.categoryName}`);
  if (filters.priority) parts.push(`Prioridade: ${PRIORITY_LABELS[filters.priority]}`);
  if (filters.status) parts.push(`Status: ${STATUS_LABELS[filters.status]}`);

  return parts.length > 0 ? parts.join('  •  ') : 'Sem filtros aplicados';
}

export function exportReportPdf(summary: ReportSummary, filters: ReportFilters, ctx: FilterLabelContext) {
  const doc = new jsPDF();
  const marginX = 14;
  let cursorY = 18;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RT HELPDESK — Relatório de Chamados', marginX, cursorY);

  cursorY += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110);
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, marginX, cursorY);

  cursorY += 5;
  const filterText = buildFilterDescription(filters, ctx);
  const filterLines = doc.splitTextToSize(filterText, 180);
  doc.text(filterLines, marginX, cursorY);
  cursorY += filterLines.length * 4 + 4;

  doc.setTextColor(20);

  autoTable(doc, {
    startY: cursorY,
    head: [['Total', 'Em aberto', 'Resolvidos', 'Tempo médio', 'SLA cumprido']],
    body: [
      [
        String(summary.totals.total),
        String(summary.totals.open),
        String(summary.totals.resolved),
        summary.totals.avgResolutionHours > 0 ? `${summary.totals.avgResolutionHours}h` : '—',
        summary.totals.slaCompliancePercent !== null ? `${summary.totals.slaCompliancePercent}%` : '—',
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { halign: 'center' },
  });

  const afterTotalsY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: afterTotalsY,
    head: [['Chamados por cliente', 'Qtd.']],
    body: summary.byCustomer.map((row) => [row.name, String(row.count)]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { right: 108 },
    tableWidth: 88,
  });
  const customerTableFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: afterTotalsY,
    head: [['Chamados por categoria', 'Qtd.']],
    body: summary.byCategory.map((row) => [row.name, String(row.count)]),
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] },
    margin: { left: 108 },
    tableWidth: 88,
  });
  const categoryTableFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  const afterMidY = Math.max(customerTableFinalY, categoryTableFinalY);

  autoTable(doc, {
    startY: afterMidY + 8,
    head: [['Chamados por atendente', 'Qtd.']],
    body: summary.byAssignee.map((row) => [row.name, String(row.count)]),
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
  });

  doc.save(`relatorio-chamados-${new Date().toISOString().slice(0, 10)}.pdf`);
}
