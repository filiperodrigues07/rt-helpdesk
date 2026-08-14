import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';
import { ok } from '../utils/apiResponse';

export const dashboardController = {
  async summary(_req: Request, res: Response) {
    const summary = await dashboardService.summary();
    return ok(res, summary);
  },
};
