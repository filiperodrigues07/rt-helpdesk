// Client HTTP para a API "Integrador BI" do ERP (CH), documentação Postman
// fornecida pelo usuário. É a base própria da revenda (uma conexão só,
// diferente do TotalChat onde cada cliente final tem seu servidor) — REST
// tradicional sobre um servidor DataSnap (Delphi), sem OAuth/login: a
// autenticação é só o header X-Token fixo gerado no CHServer.

import { AppError } from '../../utils/AppError';
import { decrypt } from '../../utils/crypto';
import { chErpConfigRepository } from '../../repositories/chErpConfigRepository';
import { ChErpCliente, ChErpListClientesResponse } from './types';

interface ResolvedConfig {
  baseUrl?: string;
  token?: string;
  cnpjPrincipal?: string;
  chaveEmpresa: number;
}

let cachedConfig: ResolvedConfig | null = null;

// invalidateConfig() é chamado depois de salvar uma configuração nova.
async function loadConfig(): Promise<ResolvedConfig> {
  if (cachedConfig) return cachedConfig;

  const dbConfig = await chErpConfigRepository.get();
  cachedConfig = {
    baseUrl: dbConfig?.baseUrl || undefined,
    token: dbConfig?.token ? decrypt(dbConfig.token) : undefined,
    cnpjPrincipal: dbConfig?.cnpjPrincipal || undefined,
    chaveEmpresa: dbConfig?.chaveEmpresa ?? 1,
  };
  return cachedConfig;
}

export function invalidateConfig(): void {
  cachedConfig = null;
}

async function isConfigured(): Promise<boolean> {
  const config = await loadConfig();
  return !!(config.baseUrl && config.token && config.cnpjPrincipal);
}

async function request<T>(path: string): Promise<T> {
  const config = await loadConfig();
  if (!config.baseUrl || !config.token || !config.cnpjPrincipal) {
    throw new AppError('Integração com o ERP não configurada (endereço/token/CNPJ ausentes)', 400);
  }

  const url = new URL(path, config.baseUrl.replace(/\/?$/, '/'));
  const response = await fetch(url, {
    headers: {
      'X-Token': config.token,
      'X-ChaveEmpresa': String(config.chaveEmpresa),
    },
  });

  if (!response.ok) {
    throw new AppError(`Erro na API do ERP: ${path} (HTTP ${response.status})`, 502);
  }

  return (await response.json()) as T;
}

export const chErpClient = {
  isConfigured,

  // Endpoint não é paginado — devolve a base inteira de uma vez (confirmado
  // em teste real: ~1700 registros num único retorno).
  async listClientes(): Promise<ChErpCliente[]> {
    const config = await loadConfig();
    const response = await request<ChErpListClientesResponse>(
      `datasnap/rest/TCHAPI/Cliente/${config.cnpjPrincipal}/${config.chaveEmpresa}`,
    );
    return response.result[0] ?? [];
  },
};
