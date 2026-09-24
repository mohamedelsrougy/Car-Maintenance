import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { jobCardService } from '../services/jobCard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const jobCardController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await jobCardService.list(req.query as never);
    res.status(StatusCodes.OK).json(result);
  }),

  board: asyncHandler(async (_req: Request, res: Response) => {
    const result = await jobCardService.board();
    res.status(StatusCodes.OK).json(result);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobCardService.getById(req.params.id!);
    res.status(StatusCodes.OK).json({ job });
  }),

  createIntake: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobCardService.createIntake(req.user!.id, req.body);
    res.status(StatusCodes.CREATED).json({ job });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobCardService.update(req.params.id!, req.body);
    res.status(StatusCodes.OK).json({ job });
  }),

  addItem: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobCardService.addItem(req.params.id!, req.user!.role, req.body);
    res.status(StatusCodes.OK).json({ job });
  }),

  removeItem: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobCardService.removeItem(req.params.id!, req.params.itemId!, req.user!.role);
    res.status(StatusCodes.OK).json({ job });
  }),

  transition: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobCardService.transition(req.params.id!, req.user!.role, req.body.status);
    res.status(StatusCodes.OK).json({ job });
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobCardService.approveEstimate(req.params.id!, req.body.nextStatus);
    res.status(StatusCodes.OK).json({ job });
  }),
};
