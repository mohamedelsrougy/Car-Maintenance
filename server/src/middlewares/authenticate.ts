import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.accessToken as string | undefined;
    if (!token) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required');
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).lean();

    if (!user || !user.isActive) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Account is inactive or not found');
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired access token'));
  }
}
