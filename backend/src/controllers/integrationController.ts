import { Request, Response } from 'express';
import { z } from 'zod';
import { totalChatService } from '../integrations/totalchat/service';
import { knowledgeBaseService } from '../integrations/knowledge-base/service';
import { ok, fail } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const totalChatConfigSchema = z.object({
  apiUrl: z.string().trim().url('URL inválida').optional().or(z.literal('')),
  username: z.string().trim().optional(),
  password: z.string().trim().optional(),
  connectionId: z.number().int().positive().nullable().optional(),
  pollingEnabled: z.boolean().optional(),
  pollIntervalSeconds: z.number().int().min(10).max(3600).optional(),
});

export const integrationController = {
  async list(_req: Request, res: Response) {
    const [totalchat, knowledgeBase] = await Promise.all([
      totalChatService.getIntegrationStatus(),
      knowledgeBaseService.getIntegrationStatus(),
    ]);

    return ok(res, [totalchat, knowledgeBase]);
  },

  async testTotalChat(_req: Request, res: Response) {
    try {
      const result = await totalChatService.testConnection();
      return ok(res, result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      return fail(res, 502, 'Não foi possível conectar ao TotalChat', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },

  async syncTotalChat(_req: Request, res: Response) {
    const result = await totalChatService.syncTickets();
    return ok(res, result);
  },

  async listTotalChatAttendants(_req: Request, res: Response) {
    const attendants = await totalChatService.listAttendants();
    return ok(res, attendants);
  },

  async getTotalChatConfig(_req: Request, res: Response) {
    const config = await totalChatService.getConfig();
    return ok(res, config);
  },

  async updateTotalChatConfig(req: Request, res: Response) {
    const input = totalChatConfigSchema.parse(req.body);
    const config = await totalChatService.updateConfig({
      ...input,
      apiUrl: input.apiUrl || undefined,
    });
    return ok(res, config);
  },
};
