import bcrypt from 'bcrypt';
import { env } from '../utils/env';
import { superAdminRepository } from '../repositories/superAdminRepository';

// Cria a primeira (e normalmente única) conta SuperAdmin a partir de
// SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD no .env, se ainda não existir.
// Idempotente — seguro chamar em todo boot do backend.
export async function ensureSuperAdminBootstrap() {
  const { bootstrapEmail, bootstrapPassword } = env.superAdmin;
  if (!bootstrapEmail || !bootstrapPassword) return;

  const existing = await superAdminRepository.findByEmail(bootstrapEmail);
  if (existing) return;

  const passwordHash = await bcrypt.hash(bootstrapPassword, 10);
  await superAdminRepository.create({ name: 'Owner', email: bootstrapEmail, passwordHash });
  console.log(`[super-admin] conta bootstrap criada para ${bootstrapEmail}`);
}
