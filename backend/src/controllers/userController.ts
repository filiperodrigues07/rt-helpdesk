import { Request, Response } from 'express';
import { userRepository } from '../repositories/userRepository';
import { ok } from '../utils/apiResponse';

export const userController = {
  async list(_req: Request, res: Response) {
    const users = await userRepository.list();
    const sanitized = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      jobTitle: user.jobTitle,
      avatarUrl: user.avatarUrl,
      active: user.active,
      role: user.role.name,
      createdAt: user.createdAt,
    }));
    return ok(res, sanitized);
  },
};
