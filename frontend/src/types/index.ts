export type RoleName = 'ADMINISTRADOR' | 'GERENTE' | 'SUPORTE' | 'IMPLANTACAO' | 'VISUALIZACAO';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  avatarUrl: string | null;
  role: RoleName;
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthenticatedUser;
}

export interface Role {
  id: string;
  name: RoleName;
  description: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  avatarUrl: string | null;
  active: boolean;
  totalchatAttendantId: string | null;
  roleId: string;
  role: RoleName;
  createdAt: string;
  ticketsAssigned: number;
  ticketsResolved: number;
  avgResolutionHours: number;
  slaCompliancePercent: number | null;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  jobTitle?: string;
  roleId: string;
  totalchatAttendantId?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  jobTitle?: string;
  roleId?: string;
  active?: boolean;
  totalchatAttendantId?: string | null;
}

export interface TotalChatAttendant {
  id: string;
  nome: string;
  departamento: string;
}

export interface ReportFilters {
  start?: string;
  end?: string;
  customerId?: string;
  assigneeId?: string;
  categoryId?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
}

export interface ReportSummary {
  totals: {
    total: number;
    open: number;
    resolved: number;
    avgResolutionHours: number;
    slaCompliancePercent: number | null;
  };
  byStatus: { status: TicketStatus; count: number }[];
  byCustomer: { customerId: string; name: string; count: number }[];
  byCategory: { categoryId: string | null; name: string; count: number }[];
  byAssignee: { assigneeId: string | null; name: string; count: number }[];
}

export interface ReportTicketRow {
  number: number;
  title: string;
  cliente: string;
  responsavel: string;
  categoria: string;
  prioridade: string;
  status: string;
  origem: string;
  abertoEm: string;
  resolvidoEm: string;
}

export type TicketStatus =
  | 'NOVO'
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_CLIENTE'
  | 'AGUARDANDO_TERCEIRO'
  | 'RESOLVIDO'
  | 'ENCERRADO';

export type TicketPriority = 'BAIXA' | 'NORMAL' | 'ALTA' | 'CRITICA';

export interface DashboardSummary {
  cards: {
    open: number;
    inProgress: number;
    waitingCustomer: number;
    waitingThirdParty: number;
    resolvedToday: number;
    slaAtRisk: number;
  };
  byStatus: { status: TicketStatus; count: number }[];
  byPriority: { priority: TicketPriority; count: number }[];
  byPeriod: { date: string; opened: number; resolved: number }[];
  byAssignee: { assigneeId: string; assigneeName: string; count: number }[];
  resolutionTimeEvolution: { date: string; avgHours: number }[];
  recentActivity: {
    id: string;
    action: string;
    fieldName: string | null;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
    author: { id: string; name: string; avatarUrl: string | null } | null;
    ticket: { id: string; number: number; title: string } | null;
  }[];
}

export type TicketOrigin = 'MANUAL' | 'TOTALCHAT';

export interface BasicUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface BasicCustomer {
  id: string;
  companyName: string;
  tradeName: string | null;
}

export interface CustomerOption {
  id: string;
  companyName: string;
  tradeName: string | null;
  city: string | null;
}

export interface CustomerListItem {
  id: string;
  companyName: string;
  tradeName: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  createdAt: string;
  _count: { tickets: number; appointments: number };
}

export interface CustomerInput {
  companyName: string;
  tradeName?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  city?: string;
  notes?: string;
}

export type AppointmentType =
  | 'SUPORTE'
  | 'IMPLANTACAO'
  | 'TREINAMENTO'
  | 'REUNIAO'
  | 'VISITA_TECNICA'
  | 'RETORNO_CLIENTE'
  | 'INTERNO';

export interface CustomerAppointment {
  id: string;
  title: string;
  type: AppointmentType;
  startsAt: string;
  endsAt: string;
  assignee: BasicUser | null;
}

export interface Appointment {
  id: string;
  title: string;
  type: AppointmentType;
  description: string | null;
  notes: string | null;
  startsAt: string;
  endsAt: string;
  customer: BasicCustomer | null;
  assignee: BasicUser | null;
}

export interface AppointmentInput {
  title: string;
  type: AppointmentType;
  customerId?: string | null;
  assigneeId?: string | null;
  startsAt: string;
  endsAt: string;
  description?: string;
  notes?: string;
}

export interface CustomerRecentTicket {
  id: string;
  number: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  assignee: BasicUser | null;
  category: { id: string; name: string } | null;
}

export interface CustomerDetail {
  id: string;
  companyName: string;
  tradeName: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    totalchatContactId: string | null;
  }[];
  byStatus: { status: TicketStatus; count: number }[];
  avgResolutionHours: number;
  responsaveis: { user: BasicUser | null; count: number }[];
  appointments: CustomerAppointment[];
  recentTickets: CustomerRecentTicket[];
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface Tag {
  id: string;
  name: string;
}

export interface TicketListItem {
  id: string;
  number: number;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  origin: TicketOrigin;
  slaDueAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: BasicCustomer;
  assignee: BasicUser | null;
  category: { id: string; name: string } | null;
  tags: { tag: Tag }[];
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface TicketComment {
  id: string;
  content: string;
  visibility: 'INTERNO' | 'CLIENTE';
  createdAt: string;
  author: BasicUser | null;
}

export interface TicketHistoryEntry {
  id: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  author: BasicUser | null;
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export interface TicketDetail {
  id: string;
  number: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  origin: TicketOrigin;
  slaDueAt: string | null;
  resolvedProblem: string | null;
  rootCause: string | null;
  appliedSolution: string | null;
  observations: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; companyName: string; tradeName: string | null; city: string | null };
  assignee: (BasicUser & { email: string }) | null;
  creator: BasicUser | null;
  category: Category | null;
  tags: { tag: Tag }[];
  comments: TicketComment[];
  history: TicketHistoryEntry[];
  attachments: TicketAttachment[];
}

export interface CreateTicketInput {
  title: string;
  description: string;
  customerId: string;
  categoryId?: string;
  priority: TicketPriority;
  assigneeId?: string;
  tagIds?: string[];
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  categoryId?: string | null;
  priority?: TicketPriority;
  assigneeId?: string | null;
  tagIds?: string[];
}

export interface ResolveTicketInput {
  status: 'RESOLVIDO' | 'ENCERRADO';
  resolvedProblem: string;
  rootCause: string;
  appliedSolution: string;
  observations?: string;
}

export interface TicketListFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
  customerId?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'number' | 'priority' | 'slaDueAt';
  sortOrder?: 'asc' | 'desc';
}

export type IntegrationStatus = 'AGUARDANDO_CONFIGURACAO' | 'CONECTADO' | 'ERRO';

export interface IntegrationInfo {
  provider: 'TOTALCHAT' | 'KNOWLEDGE_BASE';
  status: IntegrationStatus;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { message: string; details?: unknown };
}

export type NotificationType =
  | 'CHAMADO_ATRIBUIDO'
  | 'RESPONSAVEL_ALTERADO'
  | 'MENCAO_COMENTARIO'
  | 'SLA_PROXIMO_VENCIMENTO'
  | 'SLA_VENCIDO'
  | 'EVENTO_AGENDA_PROXIMO'
  | 'CHAMADO_ATUALIZADO';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  readAt: string | null;
  relatedTicketId: string | null;
  relatedAppointmentId: string | null;
  relatedUrl: string | null;
  createdAt: string;
}

export interface CustomerImportResult {
  created: number;
  skipped: { row: number; name: string; reason?: string }[];
}
