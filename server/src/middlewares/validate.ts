import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError.js';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(new ApiError(StatusCodes.BAD_REQUEST, 'Validation failed', result.error.flatten()));
      return;
    }

    req[part] = result.data;
    next();
  };
}
