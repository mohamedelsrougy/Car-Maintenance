import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(StatusCodes.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (typeof err === 'object' && err && 'code' in err && (err as { code?: number }).code === 11000) {
    res.status(StatusCodes.CONFLICT).json({
      message: 'Duplicate key',
      details: (err as { keyValue?: unknown }).keyValue,
    });
    return;
  }

  console.error(err);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: 'Internal server error',
    details: env.NODE_ENV === 'development' && err instanceof Error ? err.message : undefined,
  });
}
