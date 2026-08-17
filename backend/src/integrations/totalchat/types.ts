// Tipos derivados da documentação oficial "API TOTAL CHAT 1.80"
// (C:\RT HELPDESK\documentacao\API TOTALCHAT.pdf, fornecida pelo usuário em 2026-08-14).
//
// Onde a documentação não deixa um campo/parâmetro explícito, isso é sinalizado
// no comentário — não inventar formato além do que está documentado.

export interface TotalChatLoginResponse {
  token: string;
}

export interface TotalChatContatoResumo {
  id: number;
  nome: string;
  telefone: string;
  nomeAtendente: string;
  /** String JSON: [{ "Texto": string, "TagId": number }] */
  tagsJson: string;
}

export interface TotalChatContato extends TotalChatContatoResumo {
  conexaoId: number;
}

export interface TotalChatConexao {
  id: number;
  nome: string;
  isPrincipal: boolean;
}

// GetClienteAtendimentos — a doc não documenta explicitamente o parâmetro
// que identifica o cliente nesta chamada (provável "clienteId" na query,
// por analogia com os demais endpoints, mas não confirmado).
export interface TotalChatAtendimento {
  id: number;
  HrInicio: string;
  HrFim: string;
  NomeAparente: string;
  MotivoEncerramento: string;
}

// AtendimentosAbertos — segundo o dicionário da própria documentação,
// "id" aqui é o id do CLIENTE, não um id de atendimento. Não existe um
// endpoint para listar todos os atendimentos abertos de uma vez: é preciso
// buscar por atendente (ver listaUsuarios + atendimentosAbertos por atendenteId).
export interface TotalChatAtendimentoAberto {
  id: number;
  nome: string;
  telefone: string;
  nomeAtendente: string;
  conexaoId: number;
  atendenteId: number;
  departamento: string;
}

export interface TotalChatEtiqueta {
  id: number;
  cor: string;
  texto: string;
}

export interface TotalChatUsuario {
  id: number;
  departamentoId: number;
  nomeAparente: string;
  nomeDepartamento: string;
}

export interface TotalChatMotivoEncerramento {
  id: number;
  motivo: string;
}

/** Tipo de conteúdo da mensagem: null = texto, 1 = imagem, 2 = documento, 3 = áudio */
export type TotalChatMensagemTipo = null | 1 | 2 | 3;

export interface TotalChatMensagem {
  /** 0 = recebido, 1 = enviado */
  s: 0 | 1;
  /** id do cliente */
  i: number;
  /** nome de quem enviou */
  f: string;
  /** texto da mensagem */
  m: string;
  /** data/hora "dd/MM/yyyy HH:mm" */
  h: string;
  img: string;
  arqu: string;
  tipo: TotalChatMensagemTipo;
  /** id da mensagem */
  d: number;
  /** id da conexão (presente em alguns endpoints) */
  cId?: number;
  /** id do atendente (presente em endpoints de "não lidas") */
  aid?: number;
  lida?: boolean;
}

export interface TotalChatListaMensagensResponse {
  Items: TotalChatMensagem[];
  totalItems: number;
}

export interface TotalChatContatosPorEtiquetaResponse {
  items: TotalChatContatoResumo[];
  totalItems: number;
}

export interface TotalChatSucessoResponse {
  sucesso: boolean;
  msg?: string;
  message?: string;
}

export interface TotalChatCriaClienteResponse {
  sucesso: boolean;
  /** id do cliente criado */
  i: number;
}

export interface TotalChatEnviaMensagemResponse {
  sucesso: boolean;
  /** id do cliente (quando contato novo criado a partir de telefone) */
  i?: number;
  /** id da mensagem gravada */
  d?: number;
  message?: string;
}

export interface TotalChatOpcoesMsg {
  sections: { title: string; rows: { rowId: string; title: string; description: string }[] }[];
  buttonText: string;
  description: string;
  title: string;
  footer: string;
}

// ---- WhatsApp Cloud API (Template) ----
// "Fontes" são as conexões do tipo WhatsApp Cloud API (Meta) cadastradas na conta —
// separadas das conexões normais (v1/Contato/GetConexoes). Sem uma Fonte configurada
// no TotalChat/Meta Business, esses endpoints não têm o que listar/enviar.

export interface TotalChatWhatsAppFonte {
  id: number;
  nome: string;
  telefone: string;
  wabaId: string;
}

export interface TotalChatGetFontesResponse {
  sucesso: boolean;
  fontes: TotalChatWhatsAppFonte[];
}

/** Formato padrão da Cloud API da Meta — repassado tal e qual pelo TotalChat. */
export type TotalChatTemplateComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
export type TotalChatTemplateHeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
export type TotalChatTemplateButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';

export interface TotalChatTemplateButton {
  type: TotalChatTemplateButtonType;
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[];
}

export interface TotalChatTemplateComponent {
  type: TotalChatTemplateComponentType;
  format?: TotalChatTemplateHeaderFormat;
  text?: string;
  example?: { header_text?: string[]; header_handle?: string[]; body_text?: string[][] };
  buttons?: TotalChatTemplateButton[];
}

export interface TotalChatTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  quality_score?: unknown;
  components: TotalChatTemplateComponent[];
}

export interface TotalChatTemplateListResponse {
  data: TotalChatTemplate[];
  paging?: { cursors?: { after?: string } };
}

/** Payload de envio — mesmo formato de "send message" da Cloud API da Meta. */
export interface TotalChatSendTemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'url' | 'quick_reply';
  index?: string;
  parameters: Array<{ type: 'text'; text: string } | { type: 'image'; image: { link: string } }>;
}

export interface TotalChatSendTemplateInput {
  clienteId: number;
  fid: number;
  templateName: string;
  language: string;
  templatePreview?: boolean;
  components: TotalChatSendTemplateComponent[];
}

export interface TotalChatSendTemplateResponse {
  sucesso: boolean;
  d?: unknown;
  ut?: unknown;
  messageId?: string;
  msg?: string;
}
