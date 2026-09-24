import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { invoiceService } from '../services/invoice.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const invoiceController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await invoiceService.list(req.query as never);
    res.status(StatusCodes.OK).json(result);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoiceService.getById(req.params.id!);
    res.status(StatusCodes.OK).json({ invoice });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoiceService.createFromJob(req.body.jobCardId);
    res.status(StatusCodes.CREATED).json({ invoice });
  }),

  issue: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoiceService.issue(req.params.id!);
    res.status(StatusCodes.OK).json({ invoice });
  }),

  recordPayment: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoiceService.recordPayment(req.params.id!, req.body);
    res.status(StatusCodes.OK).json({ invoice });
  }),
};
