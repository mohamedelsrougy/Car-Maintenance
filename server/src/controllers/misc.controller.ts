import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { dashboardService } from '../services/dashboard.service.js';
import { lookupService } from '../services/lookup.service.js';
import { userDirectoryService } from '../services/userDirectory.service.js';
import type { UserRole } from '../types/enums.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardController = {
  summary: asyncHandler(async (_req: Request, res: Response) => {
    const summary = await dashboardService.summary();
    res.status(StatusCodes.OK).json(summary);
  }),
};

export const lookupController = {
  find: asyncHandler(async (req: Request, res: Response) => {
    const result = await lookupService.find(req.query as never);
    res.status(StatusCodes.OK).json(result);
  }),
};

export const userDirectoryController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const users = await userDirectoryService.list(req.query.role as UserRole | undefined);
    res.status(StatusCodes.OK).json({ users });
  }),
};
