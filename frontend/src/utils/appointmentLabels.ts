import type { AppointmentType } from '@/types';

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  SUPORTE: 'Suporte',
  IMPLANTACAO: 'Implantação',
  TREINAMENTO: 'Treinamento',
  REUNIAO: 'Reunião',
  VISITA_TECNICA: 'Visita técnica',
  RETORNO_CLIENTE: 'Retorno ao cliente',
  INTERNO: 'Interno',
};

// Cores hex (usadas diretamente nos eventos do FullCalendar).
export const APPOINTMENT_TYPE_COLORS: Record<AppointmentType, string> = {
  SUPORTE: '#3b82f6',
  IMPLANTACAO: '#8b5cf6',
  TREINAMENTO: '#22c55e',
  REUNIAO: '#f59e0b',
  VISITA_TECNICA: '#ec4899',
  RETORNO_CLIENTE: '#06b6d4',
  INTERNO: '#64748b',
};
