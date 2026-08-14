import {
  AlertTriangle,
  CalendarClock,
  MessageSquareText,
  RefreshCw,
  UserCheck,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationType } from '@/types';

export const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  CHAMADO_ATRIBUIDO: UserCheck,
  RESPONSAVEL_ALTERADO: UserCog,
  MENCAO_COMENTARIO: MessageSquareText,
  SLA_PROXIMO_VENCIMENTO: AlertTriangle,
  SLA_VENCIDO: AlertTriangle,
  EVENTO_AGENDA_PROXIMO: CalendarClock,
  CHAMADO_ATUALIZADO: RefreshCw,
};

export const NOTIFICATION_TONE: Record<NotificationType, 'default' | 'warning' | 'destructive'> = {
  CHAMADO_ATRIBUIDO: 'default',
  RESPONSAVEL_ALTERADO: 'default',
  MENCAO_COMENTARIO: 'default',
  SLA_PROXIMO_VENCIMENTO: 'warning',
  SLA_VENCIDO: 'destructive',
  EVENTO_AGENDA_PROXIMO: 'default',
  CHAMADO_ATUALIZADO: 'default',
};
