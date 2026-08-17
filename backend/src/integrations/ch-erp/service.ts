import { encrypt } from '../../utils/crypto';
import { chErpConfigRepository } from '../../repositories/chErpConfigRepository';
import { customerRepository } from '../../repositories/customerRepository';
import { chErpClient, invalidateConfig } from './client';
import { ChErpCliente } from './types';

export interface ChErpConfigInput {
  baseUrl?: string;
  token?: string;
  cnpjPrincipal?: string;
  chaveEmpresa?: number;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Customer.cnpj só aceita CNPJ (14 dígitos) — clientes pessoa física (CPF,
// 11 dígitos) do ERP não têm um campo equivalente pra casar/gravar, então
// ficam de fora da importação (contam como "skipped" no resumo).
function normalizeCnpj(cnpjcpf: string): string | undefined {
  const digits = cnpjcpf.replace(/\D/g, '');
  return digits.length === 14 ? digits : undefined;
}

// CIDADE vem como "JOACABA (SC)" — a UF já é um campo separado.
function cleanCity(cidade: string): string | undefined {
  const cleaned = cidade.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return cleaned || undefined;
}

function mapClienteToCustomerData(cliente: ChErpCliente) {
  const cnpj = normalizeCnpj(cliente.CNPJCPF);
  if (!cnpj) return null;

  return {
    companyName: cliente.RAZAOSOCIAL || cliente.FANTASIA || cnpj,
    tradeName: cliente.FANTASIA || undefined,
    cnpj,
    phone: cliente.CELULAR || cliente.TELEFONE || undefined,
    email: cliente.EMAIL && EMAIL_PATTERN.test(cliente.EMAIL) ? cliente.EMAIL : undefined,
    city: cleanCity(cliente.CIDADE),
  };
}

export const chErpService = {
  async getIntegrationStatus() {
    return {
      provider: 'CH_ERP' as const,
      status: (await chErpClient.isConfigured()) ? 'CONECTADO' : 'AGUARDANDO_CONFIGURACAO',
    };
  },

  async testConnection() {
    await chErpClient.listClientes();
    return { configured: true };
  },

  async syncClientes() {
    const clientes = await chErpClient.listClientes();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const cliente of clientes) {
      const data = mapClienteToCustomerData(cliente);
      if (!data) {
        skipped++;
        continue;
      }

      const existing = await customerRepository.findByCnpj(data.cnpj);
      if (existing) {
        await customerRepository.update(existing.id, data);
        updated++;
      } else {
        await customerRepository.create(data);
        created++;
      }
    }

    return { total: clientes.length, created, updated, skipped };
  },

  async getConfig() {
    const dbConfig = await chErpConfigRepository.get();
    return {
      baseUrl: dbConfig?.baseUrl || '',
      hasToken: !!dbConfig?.token,
      cnpjPrincipal: dbConfig?.cnpjPrincipal || '',
      chaveEmpresa: dbConfig?.chaveEmpresa ?? 1,
    };
  },

  async updateConfig(input: ChErpConfigInput) {
    await chErpConfigRepository.upsert({
      baseUrl: input.baseUrl,
      ...(input.token ? { token: encrypt(input.token) } : {}),
      cnpjPrincipal: input.cnpjPrincipal,
      chaveEmpresa: input.chaveEmpresa,
    });

    invalidateConfig();

    return this.getConfig();
  },
};
