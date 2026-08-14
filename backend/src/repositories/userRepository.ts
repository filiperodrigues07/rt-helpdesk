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
};
