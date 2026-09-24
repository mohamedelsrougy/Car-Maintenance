import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { vehicleService } from '../services/vehicle.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const vehicleController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await vehicleService.list(req.query as never);
    res.status(StatusCodes.OK).json(result);
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    const result = await vehicleService.history(req.query as never);
    res.status(StatusCodes.OK).json(result);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehicleService.getById(req.params.id!);
    res.status(StatusCodes.OK).json({ vehicle });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehicleService.create(req.body);
    res.status(StatusCodes.CREATED).json({ vehicle });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehicleService.update(req.params.id!, req.body);
    res.status(StatusCodes.OK).json({ vehicle });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await vehicleService.remove(req.params.id!);
    res.status(StatusCodes.NO_CONTENT).send();
  }),
};
