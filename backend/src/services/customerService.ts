import { customerRepository, CustomerListFilters, CustomerListOptions } from '../repositories/customerRepository';
import { AppError } from '../utils/AppError';

interface CustomerInput {
  companyName: string;
  tradeName?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  city?: string;
  notes?: string;
}

export const customerService = {
  async list(filters: CustomerListFilters, options: CustomerListOptions) {
    const { items, total } = await customerRepository.list(filters, options);
    return {
      items,
      pagination: {
        page: options.page,
        pageSize: options.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / options.pageSize)),
      },
    };
  },

  listMinimal() {
    return customerRepository.listMinimal();
  },

  async getById(id: string) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new AppError('Cliente não encontrado', 404);
    }
    const indicators = await customerRepository.getIndicators(id);
    return { ...customer, ...indicators };
  },

  async create(input: CustomerInput) {
    if (input.cnpj) {
      const existing = await customerRepository.findByCnpj(input.cnpj);
      if (existing) {
        throw new AppError('Já existe um cliente cadastrado com este CNPJ', 409);
      }
    }
    return customerRepository.create(input);
  },

  async update(id: string, input: Partial<CustomerInput>) {
    if (input.cnpj) {
      const existing = await customerRepository.findByCnpj(input.cnpj);
      if (existing && existing.id !== id) {
        throw new AppError('Já existe um cliente cadastrado com este CNPJ', 409);
      }
    }
    return customerRepository.update(id, input);
  },

  async importBatch(rows: CustomerInput[]) {
    const results: { row: number; status: 'created' | 'skipped'; name: string; reason?: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row.companyName || row.companyName.trim().length < 2) {
        results.push({ row: i + 1, status: 'skipped', name: row.companyName || '(sem nome)', reason: 'Razão social ausente ou muito curta' });
        continue;
      }

      if (row.cnpj) {
        const existing = await customerRepository.findByCnpj(row.cnpj);
        if (existing) {
          results.push({ row: i + 1, status: 'skipped', name: row.companyName, reason: 'CNPJ já cadastrado' });
          continue;
        }
      }

      await customerRepository.create(row);
      results.push({ row: i + 1, status: 'created', name: row.companyName });
    }

    return {
      created: results.filter((r) => r.status === 'created').length,
      skipped: results.filter((r) => r.status === 'skipped'),
    };
  },
};
