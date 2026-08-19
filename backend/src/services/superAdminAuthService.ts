import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { AppError } from '../utils/AppError';
import { superAdminRepository } from '../repositories/superAdminRepository';

interface LoginInput {
  email: string;
  password: string;
}

export const superAdminAuthService = {
  async login({ email, password }: LoginInput) {
    const superAdmin = await superAdminRepository.findByEmail(email);

    if (!superAdmin) {
      throw new AppError('Credenciais inválidas', 401);
    }

    const passwordMatches = await bcrypt.compare(password, superAdmin.passwordHash);

    if (!passwordMatches) {
      throw new AppError('Credenciais inválidas', 401);
    }

    const token = jwt.sign(
      { superAdminId: superAdmin.id, email: superAdmin.email, scope: 'super-admin' as const },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn } as jwt.SignOptions,
    );

    return {
      token,
      superAdmin: { id: superAdmin.id, name: superAdmin.name, email: superAdmin.email },
    };
  },

  async me(superAdminId: string) {
    const superAdmin = await superAdminRepository.findById(superAdminId);

    if (!superAdmin) {
      throw new AppError('Super admin não encontrado', 404);
    }

    return { id: superAdmin.id, name: superAdmin.name, email: superAdmin.email };
  },
};
