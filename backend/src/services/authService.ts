import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { AppError } from '../utils/AppError';
import { userRepository } from '../repositories/userRepository';

interface LoginInput {
  email: string;
  password: string;
}

export const authService = {
  async login({ email, password }: LoginInput) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.active || !user.tenant.active) {
      throw new AppError('Credenciais inválidas', 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError('Credenciais inválidas', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name, tenantId: user.tenantId },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn } as jwt.SignOptions,
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle,
        avatarUrl: user.avatarUrl,
        role: user.role.name,
        permissions: user.role.permissions.map((p) => p.key),
      },
    };
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      jobTitle: user.jobTitle,
      avatarUrl: user.avatarUrl,
      role: user.role.name,
      permissions: user.role.permissions.map((p) => p.key),
    };
  },
};
