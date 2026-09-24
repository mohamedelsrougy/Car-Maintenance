import { Router } from 'express';
import { vehicleController } from '../controllers/vehicle.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { adminOnly, authenticatedStaff, canWriteCustomers } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.js';
import {
  vehicleBodySchema,
  vehicleHistoryQuerySchema,
  vehicleQuerySchema,
  vehicleUpdateSchema,
} from '../validators/vehicle.schema.js';

export const vehicleRouter = Router();

vehicleRouter.use(authenticate, authenticatedStaff);

vehicleRouter.get('/history', validate(vehicleHistoryQuerySchema, 'query'), vehicleController.history);
vehicleRouter.get('/', validate(vehicleQuerySchema, 'query'), vehicleController.list);
vehicleRouter.get('/:id', validate(idParamSchema, 'params'), vehicleController.get);
vehicleRouter.post('/', canWriteCustomers, validate(vehicleBodySchema), vehicleController.create);
vehicleRouter.patch('/:id', canWriteCustomers, validate(idParamSchema, 'params'), validate(vehicleUpdateSchema), vehicleController.update);
vehicleRouter.delete('/:id', adminOnly, validate(idParamSchema, 'params'), vehicleController.remove);
