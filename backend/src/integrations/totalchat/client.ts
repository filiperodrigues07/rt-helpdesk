// Client HTTP para a API oficial do TotalChat (v1.80), conforme documentação
// fornecida pelo usuário (C:\RT HELPDESK\documentacao\API TOTALCHAT.pdf).
//
// Não há webhook nesta API — é uma API REST tradicional de consulta (pull).
// A sincronização de chamados deve ser feita por polling (ver service.ts).

import { env } from '../../utils/env';
import { AppError } from '../../utils/AppError';
import { decrypt } from '../../utils/crypto';
import { totalChatConfigRepository } from '../../repositories/totalChatConfigRepository';
import {
  TotalChatAtendimento,
  TotalChatAtendimentoAberto,
  TotalChatConexao,
  TotalChatContato,
  TotalChatContatoResumo,
  TotalChatContatosPorEtiquetaResponse,
  TotalChatCriaClienteResponse,
  TotalChatEnviaMensagemResponse,
  TotalChatEtiqueta,
  TotalChatListaMensagensResponse,
  TotalChatLoginResponse,
  TotalChatMensagem,
  TotalChatMotivoEncerramento,
  TotalChatOpcoesMsg,
  TotalChatSucessoResponse,
  TotalChatUsuario,
} from './types';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12h, conforme documentação
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000; // reautentica 5 min antes de expirar

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

interface ResolvedConfig {
  apiUrl: string;
  username?: string;
  password?: string;
  connectionId?: number;
}

let cachedConfig: ResolvedConfig | null = null;

// As credenciais podem ser cadastradas em Configurações (guardadas no banco,
// senha criptografada) ou via .env — o banco tem prioridade quando presente.
// invalidateConfig() é chamado depois de salvar uma configuração nova.
async function loadConfig(): Promise<ResolvedConfig> {
  if (cachedConfig) return cachedConfig;

  const dbConfig = await totalChatConfigRepository.get();
  cachedConfig = {
    apiUrl: dbConfig?.apiUrl || env.totalChat.apiUrl,
    username: dbConfig?.username || env.totalChat.username,
    password: dbConfig?.password ? decrypt(dbConfig.password) : env.totalChat.password,
    connectionId: dbConfig?.connectionId ?? env.totalChat.connectionId,
  };
  return cachedConfig;
}

export function invalidateConfig(): void {
  cachedConfig = null;
  cachedToken = null;
}

async function isConfigured(): Promise<boolean> {
  const config = await loadConfig();
  return !!(config.username && config.password);
}

async function baseUrl(): Promise<string> {
  const config = await loadConfig();
  return config.apiUrl.replace(/\/?$/, '/');
}

async function login(): Promise<string> {
  const config = await loadConfig();
  if (!config.username || !config.password) {
    throw new AppError('Integração com o TotalChat não configurada (usuário/senha ausentes)', 400);
  }

  const response = await fetch(new URL('v1/account/login', await baseUrl()), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: config.username, password: config.password }),
  });

  if (!response.ok) {
    throw new AppError(`Falha ao autenticar no TotalChat (HTTP ${response.status})`, 502);
  }

  const data = (await response.json()) as TotalChatLoginResponse;
  cachedToken = { token: data.token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return data.token;
}

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
    return cachedToken.token;
  }
  return login();
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  retryOn401?: boolean;
}

async function buildUrl(path: string, query?: RequestOptions['query']): Promise<URL> {
  const url = new URL(path, await baseUrl());
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.append(key, String(value));
    }
  }
  return url;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getToken();
  const url = await buildUrl(path, options.query);

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && options.retryOn401 !== false) {
    cachedToken = null;
    await getToken();
    return request<T>(path, { ...options, retryOn401: false });
  }

  if (!response.ok) {
    throw new AppError(`Erro na API do TotalChat: ${path} (HTTP ${response.status})`, 502);
  }

  return (await response.json()) as T;
}

async function requestMultipart<T>(
  path: string,
  dados: Record<string, unknown>,
  file: { buffer: Buffer; fileName: string; mimeType: string; fieldName: 'Arquivo' | 'Imagem' },
): Promise<T> {
  const token = await getToken();
  const url = await buildUrl(path);

  const formData = new FormData();
  formData.append('Dados', JSON.stringify(dados));
  formData.append(file.fieldName, new Blob([file.buffer], { type: file.mimeType }), file.fileName);

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    throw new AppError(`Erro na API do TotalChat: ${path} (HTTP ${response.status})`, 502);
  }

  return (await response.json()) as T;
}

export const totalChatClient = {
  isConfigured,

  async testLogin(): Promise<boolean> {
    cachedToken = null;
    await login();
    return true;
  },

  // ---- Contatos ----
  listContacts(pag = 0) {
    return request<TotalChatContatoResumo[]>('v1/Contato/ListaTodos', { query: { pag } });
  },

  getContatoPorTelefone(telefoneOuGrupo: string) {
    return request<TotalChatContato>(`v1/Contato/GetContatoPorTelefone/${encodeURIComponent(telefoneOuGrupo)}`);
  },

  getContatoPorId(id: number) {
    return request<TotalChatContato>(`v1/Contato/GetContatoPorId/${id}`);
  },

  criaCliente(input: { nome: string; telefone: string; conexaoId: number }) {
    return request<TotalChatCriaClienteResponse>('v1/contato/CriaCliente', {
      method: 'POST',
      body: { Nome: input.nome, Telefone: input.telefone, ConexaoId: input.conexaoId },
    });
  },

  getConexoes() {
    return request<TotalChatConexao[]>('v1/Contato/GetConexoes');
  },

  listaUsuarios(pag = 0) {
    return request<TotalChatUsuario[]>('v1/Contato/ListaUsuarios', { query: { pag } });
  },

  transfereContato(input: { clienteId: number; departamentoId?: number; atendenteId?: number }) {
    return request<TotalChatSucessoResponse>('v1/Contato/TransfereContato', {
      method: 'POST',
      body: {
        ClienteId: input.clienteId,
        ...(input.departamentoId !== undefined ? { DepartamentoId: input.departamentoId } : {}),
        ...(input.atendenteId !== undefined ? { AtendenteId: input.atendenteId } : {}),
      },
    });
  },

  // ---- Etiquetas ----
  async getEtiquetas() {
    const response = await request<{ sucesso: boolean; etiquetas: TotalChatEtiqueta[] }>('v1/Contato/GetEtiquetas');
    return response.etiquetas;
  },

  adicionaEtiqueta(clienteId: number, tagId: number) {
    return request<TotalChatSucessoResponse>('v1/Contato/AdicionaEtiqueta', {
      method: 'POST',
      body: { clienteId, tagId },
    });
  },

  removeEtiqueta(clienteId: number, tagId: number) {
    return request<TotalChatSucessoResponse>('v1/Contato/RemoveEtiqueta', {
      method: 'POST',
      body: { clienteId, tagId },
    });
  },

  async getContatosPorEtiqueta(etiquetaIds: number[], pag = 0) {
    const url = await buildUrl('v1/Contato/GetContatosPorEtiqueta');
    etiquetaIds.forEach((id) => url.searchParams.append('etiquetaId', String(id)));
    url.searchParams.set('pag', String(pag));
    return request<TotalChatContatosPorEtiquetaResponse>(url.pathname + url.search);
  },

  // ---- Mensagens ----
  getMensagens(clienteId: number, pag = 0) {
    return request<TotalChatMensagem[]>('v1/Contato/GetMensagens', { query: { clienteId, pag } });
  },

  getTodasMensagensNaoLidas(pag = 0, marcaLida = false) {
    return request<TotalChatMensagem[]>('v1/Contato/GetTodasMensagensNaoLidas', { query: { pag, marcaLida } });
  },

  getMensagensNaoLidas(clienteId: number, conexaoId: number, pag = 0) {
    return request<TotalChatMensagem[]>('v1/Contato/GetMensagensNaoLidas', {
      query: { clienteId, conexaoId, pag },
    });
  },

  getMensagensTelefone(telefone: string, pag = 0) {
    return request<TotalChatMensagem[]>('v1/Contato/GetMensagensTelefone', { query: { telefone, pag } });
  },

  getMensagensNaoLidasTelefone(telefone: string, conexaoId: number, pag = 0) {
    return request<TotalChatMensagem[]>('v1/Contato/GetMensagensNaoLidasTelefone', {
      query: { telefone, conexaoId, pag },
    });
  },

  listaMensagens(input: {
    clienteId: number;
    dataInicio: string;
    dataFim: string;
    recebidas?: boolean;
    enviadas?: boolean;
    conexaoId?: number;
    pag?: number;
  }) {
    return request<TotalChatListaMensagensResponse>('v1/Contato/ListaMensagens', {
      query: {
        clienteId: input.clienteId,
        dataInicio: input.dataInicio,
        dataFim: input.dataFim,
        recebidas: input.recebidas,
        enviadas: input.enviadas,
        conexaoId: input.conexaoId,
        pag: input.pag ?? 0,
      },
    });
  },

  enviaMensagem(input: {
    clienteId?: number;
    telefone?: string;
    conexaoId?: number;
    mensagem: string;
    iniciaBot?: boolean;
    abreAtendimento?: boolean;
    opcoesMsg?: TotalChatOpcoesMsg;
  }) {
    const body = input.clienteId
      ? {
          ClienteId: input.clienteId,
          Mensagem: input.mensagem,
          IniciaBot: input.iniciaBot,
          AbreAtendimento: input.abreAtendimento,
          OpcoesMsg: input.opcoesMsg,
        }
      : {
          Telefone: input.telefone,
          ConexaoId: input.conexaoId,
          Mensagem: input.mensagem,
          IniciaBot: input.iniciaBot,
          AbreAtendimento: input.abreAtendimento,
          OpcoesMsg: input.opcoesMsg,
        };

    return request<TotalChatEnviaMensagemResponse>('v1/contato/EnviaMensagem', { method: 'POST', body });
  },

  enviaImagem(
    input: { clienteId?: number; telefone?: string; conexaoId?: number; mensagem?: string },
    file: { buffer: Buffer; fileName: string; mimeType: string },
  ) {
    const dados = input.clienteId
      ? { ClienteId: input.clienteId, Mensagem: input.mensagem }
      : { Telefone: input.telefone, ConexaoId: input.conexaoId, Mensagem: input.mensagem };
    return requestMultipart<TotalChatEnviaMensagemResponse>('v1/contato/EnviaImagem', dados, {
      ...file,
      fieldName: 'Arquivo',
    });
  },

  enviaDocumento(
    input: { clienteId?: number; telefone?: string; conexaoId?: number; mensagem?: string },
    file: { buffer: Buffer; fileName: string; mimeType: string },
  ) {
    const dados = input.clienteId
      ? { ClienteId: input.clienteId, Mensagem: input.mensagem }
      : { Telefone: input.telefone, ConexaoId: input.conexaoId, Mensagem: input.mensagem };
    return requestMultipart<TotalChatEnviaMensagemResponse>('v1/contato/EnviaDocumento', dados, {
      ...file,
      fieldName: 'Imagem',
    });
  },

  // ---- Atendimentos ----
  // Parâmetro de identificação do cliente não confirmado pela documentação — ver types.ts.
  getClienteAtendimentos(clienteId: number) {
    return request<TotalChatAtendimento[]>('v1/Contato/GetClienteAtendimentos', { query: { clienteId } });
  },

  atendimentosAbertos(atendenteId: number) {
    return request<TotalChatAtendimentoAberto[]>('v1/Contato/AtendimentosAbertos', { query: { atendenteId } });
  },

  encerraAtendimento(input: { clienteId: number; atendenteId: number; motivoId: number }) {
    return request<TotalChatSucessoResponse>('v1/Contato/EncerraAtendimento', {
      method: 'POST',
      body: { ClienteId: input.clienteId, AtendenteId: input.atendenteId, MotivoId: input.motivoId },
    });
  },

  getMotivosEncerramento() {
    return request<TotalChatMotivoEncerramento[]>('v1/Contato/GetMotivosEncerramento');
  },
};
