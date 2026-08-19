import { AsyncLocalStorage } from 'node:async_hooks';

interface TenantContextStore {
  tenantId: string;
}

const storage = new AsyncLocalStorage<TenantContextStore>();

// Carrega o tenantId da requisição atual por toda a cadeia assíncrona
// (controller -> service -> repository) sem precisar passar `req` explicitamente
// por cada função. Ativado por middlewares/tenantScope.ts logo após authenticate.
export const tenantContext = {
  run<T>(tenantId: string, fn: () => T): T {
    return storage.run({ tenantId }, fn);
  },

  getTenantId(): string {
    const store = storage.getStore();
    if (!store) {
      throw new Error(
        'tenantContext.getTenantId() chamado fora de uma requisição com tenantScope ativo — verifique se a rota usa o middleware tenantScope.',
      );
    }
    return store.tenantId;
  },
};
