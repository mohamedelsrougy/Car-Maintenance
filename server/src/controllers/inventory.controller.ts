import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { inventoryService } from '../services/inventory.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const inventoryController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await inventoryService.list(req.query as never);
    res.status(StatusCodes.OK).json(result);
  }),

  lowStock: asyncHandler(async (_req: Request, res: Response) => {
    const result = await inventoryService.lowStock();
    res.status(StatusCodes.OK).json(result);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const item = await inventoryService.getById(req.params.id!);
    res.status(StatusCodes.OK).json({ item });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await inventoryService.create(req.body);
    res.status(StatusCodes.CREATED).json({ item });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await inventoryService.update(req.params.id!, req.body);
    res.status(StatusCodes.OK).json({ item });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await inventoryService.remove(req.params.id!);
    res.status(StatusCodes.NO_CONTENT).send();
  }),
};
