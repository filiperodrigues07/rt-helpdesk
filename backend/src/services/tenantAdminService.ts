import { tenantRepository } from '../repositories/tenantRepository';
import { tenantProvisioningService, ProvisionTenantInput } from './tenantProvisioningService';
import { AppError } from '../utils/AppError';

function sanitize(tenant: { id: string; name: string; slug: string; active: boolean; createdAt: Date }) {
  return { id: tenant.id, name: tenant.name, slug: tenant.slug, active: tenant.active, createdAt: tenant.createdAt };
}

export const tenantAdminService = {
  async list() {
    const tenants = await tenantRepository.list();
    return tenants.map(sanitize);
  },

  async create(input: ProvisionTenantInput) {
    const result = await tenantProvisioningService.provisionTenant(input);
    return { ...sanitize(result.tenant), adminUser: result.adminUser };
  },

  async setActive(id: string, active: boolean) {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) {
      throw new AppError('Tenant não encontrado', 404);
    }
    const updated = await tenantRepository.updateActive(id, active);
    return sanitize(updated);
  },
};
