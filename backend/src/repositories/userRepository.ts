import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  },

  list() {
    return prisma.user.findMany({
      include: { role: true },
      orderBy: { name: 'asc' },
    });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data, include: { role: true } });
  },

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data, include: { role: true } });
  },
};
