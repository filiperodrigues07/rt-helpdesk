import type { TicketPriority, TicketStatus } from '@/types';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  NOVO: 'Novo',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_CLIENTE: 'Aguardando cliente',
  AGUARDANDO_TERCEIRO: 'Aguardando terceiro',
  RESOLVIDO: 'Resolvido',
  ENCERRADO: 'Encerrado',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  BAIXA: 'Baixa',
  NORMAL: 'Normal',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

// Cores discretas por prioridade (hex — usadas em gráficos Recharts que não aceitam hsl(var(...))).
export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  BAIXA: '#64748b',
  NORMAL: '#3b82f6',
  ALTA: '#f59e0b',
  CRITICA: '#ef4444',
};
