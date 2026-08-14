import { Request, Response } from 'express';
import { totalChatService } from '../integrations/totalchat/service';
import { knowledgeBaseService } from '../integrations/knowledge-base/service';
import { ok, fail } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

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
};
