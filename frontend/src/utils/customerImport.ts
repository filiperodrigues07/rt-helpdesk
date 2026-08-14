import type { CustomerInput } from '@/types';

const DIACRITICS_PATTERN = new RegExp('[\\u0300-\\u036f]', 'g');

function normalizeHeader(header: string): string {
  return header.normalize('NFD').replace(DIACRITICS_PATTERN, '').trim().toLowerCase();
}

const FIELD_ALIASES: Record<keyof CustomerInput, string[]> = {
  companyName: ['razao social', 'companyname', 'empresa', 'nome'],
  tradeName: ['nome fantasia', 'tradename', 'fantasia'],
  cnpj: ['cnpj'],
  phone: ['telefone', 'phone', 'fone', 'celular'],
  email: ['e-mail', 'email'],
  city: ['cidade', 'city'],
  notes: ['observacoes', 'notes', 'obs'],
};

/** Casa os cabeçalhos de um CSV importado com os campos de Cliente, tolerando variações de nome/acento. */
export function buildHeaderMap(headers: string[]): Partial<Record<keyof CustomerInput, string>> {
  const map: Partial<Record<keyof CustomerInput, string>> = {};
  const normalizedHeaders = headers.map((header) => ({ original: header, normalized: normalizeHeader(header) }));

  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [keyof CustomerInput, string[]][]) {
    const match = normalizedHeaders.find((h) => aliases.includes(h.normalized));
    if (match) map[field] = match.original;
  }

  return map;
}

export function rowToCustomerInput(
  row: Record<string, string>,
  headerMap: Partial<Record<keyof CustomerInput, string>>,
): CustomerInput {
  const get = (field: keyof CustomerInput) => (headerMap[field] ? row[headerMap[field] as string] : '') || undefined;

  return {
    companyName: get('companyName') ?? '',
    tradeName: get('tradeName'),
    cnpj: get('cnpj'),
    phone: get('phone'),
    email: get('email'),
    city: get('city'),
    notes: get('notes'),
  };
}
