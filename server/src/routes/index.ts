import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { customerRouter } from './customer.routes.js';
import { inventoryRouter } from './inventory.routes.js';
import { invoiceRouter } from './invoice.routes.js';
import { jobCardRouter } from './jobCard.routes.js';
import { dashboardRouter, lookupRouter, usersRouter } from './misc.routes.js';
import { vehicleRouter } from './vehicle.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/vehicles', vehicleRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/jobs', jobCardRouter);
apiRouter.use('/invoices', invoiceRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/lookup', lookupRouter);
apiRouter.use('/users', usersRouter);
