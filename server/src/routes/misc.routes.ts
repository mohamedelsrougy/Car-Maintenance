import { Router } from 'express';
import { dashboardController, lookupController, userDirectoryController } from '../controllers/misc.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authenticatedStaff, canCreateJobs } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { lookupQuerySchema } from '../validators/lookup.schema.js';
import { z } from 'zod';
import { USER_ROLES } from '../types/enums.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate, authenticatedStaff);
dashboardRouter.get('/summary', dashboardController.summary);

export const lookupRouter = Router();
lookupRouter.use(authenticate, authenticatedStaff);
lookupRouter.get('/', validate(lookupQuerySchema, 'query'), lookupController.find);

export const usersRouter = Router();
usersRouter.use(authenticate, canCreateJobs);
usersRouter.get(
  '/',
  validate(z.object({ role: z.enum(USER_ROLES).optional() }), 'query'),
  userDirectoryController.list,
);
