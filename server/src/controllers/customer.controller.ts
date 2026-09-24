import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { customerService } from '../services/customer.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const customerController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await customerService.list(req.query as never);
    res.status(StatusCodes.OK).json(result);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.getById(req.params.id!);
    res.status(StatusCodes.OK).json({ customer });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.create(req.body);
    res.status(StatusCodes.CREATED).json({ customer });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.update(req.params.id!, req.body);
    res.status(StatusCodes.OK).json({ customer });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await customerService.remove(req.params.id!);
    res.status(StatusCodes.NO_CONTENT).send();
  }),
};
