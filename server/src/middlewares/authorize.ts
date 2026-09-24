import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { UserRole } from '../types/enums.js';
import { ApiError } from '../utils/ApiError.js';

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to perform this action'));
      return;
    }

    next();
  };
}

export const canManageEstimates = authorize('admin', 'advisor');
export const canRecordPayments = authorize('admin', 'cashier');
export const adminOnly = authorize('admin');
export const authenticatedStaff = authorize('admin', 'advisor', 'technician', 'cashier');
export const canWriteCustomers = authorize('admin', 'advisor');
export const canCreateJobs = authorize('admin', 'advisor');
export const canWriteInventory = authorize('admin');
export const canIssueInvoices = authorize('admin', 'advisor', 'cashier');
