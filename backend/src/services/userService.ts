import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/userRepository';
import { AppError } from '../utils/AppError';

interface ProductivityStats {
  ticketsAssigned: number;
  ticketsResolved: number;
  avgResolutionHours: number;
  slaCompliancePercent: number | null;
}

const EMPTY_STATS: ProductivityStats = {
  ticketsAssigned: 0,
  ticketsResolved: 0,
  avgResolutionHours: 0,
  slaCompliancePercent: null,
};

function sanitize(user: Awaited<ReturnType<typeof userRepository.list>>[number], stats: ProductivityStats) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    jobTitle: user.jobTitle,
    avatarUrl: user.avatarUrl,
    active: user.active,
    totalchatAttendantId: user.totalchatAttendantId,
    roleId: user.roleId,
    role: user.role.name,
    createdAt: user.createdAt,
    ...stats,
  };
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  jobTitle?: string;
  roleId: string;
  totalchatAttendantId?: string | null;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  jobTitle?: string;
  roleId?: string;
  active?: boolean;
  totalchatAttendantId?: string | null;
}

export const userService = {
  async list() {
    const [users, stats] = await Promise.all([userRepository.list(), userRepository.getProductivityStats()]);

    return users.map((user) =>
      sanitize(user, {
        ticketsAssigned: stats.assignedMap.get(user.id) ?? 0,
        ticketsResolved: stats.resolvedMap.get(user.id) ?? 0,
        avgResolutionHours: Math.round((stats.avgMap.get(user.id) ?? 0) * 10) / 10,
        slaCompliancePercent: stats.slaMap.get(user.id) ?? null,
      }),
    );
  },

  async create(input: CreateUserInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError('Já existe um usuário cadastrado com este e-mail', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      jobTitle: input.jobTitle,
      totalchatAttendantId: input.totalchatAttendantId,
      role: { connect: { id: input.roleId } },
    });

    return sanitize(user, EMPTY_STATS);
  },

  async update(id: string, input: UpdateUserInput) {
    const current = await userRepository.findById(id);
    if (!current) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (input.email && input.email !== current.email) {
      const existing = await userRepository.findByEmail(input.email);
      if (existing) {
        throw new AppError('Já existe um usuário cadastrado com este e-mail', 409);
      }
    }

    const user = await userRepository.update(id, {
      name: input.name,
      email: input.email,
      jobTitle: input.jobTitle,
      active: input.active,
      totalchatAttendantId: input.totalchatAttendantId,
      passwordHash: input.password ? await bcrypt.hash(input.password, 10) : undefined,
      role: input.roleId ? { connect: { id: input.roleId } } : undefined,
    });

    return sanitize(user, EMPTY_STATS);
  },
};
