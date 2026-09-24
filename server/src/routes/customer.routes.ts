import { Router } from 'express';
import { customerController } from '../controllers/customer.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { adminOnly, authenticatedStaff, canWriteCustomers } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { customerBodySchema, customerQuerySchema, customerUpdateSchema } from '../validators/customer.schema.js';
import { idParamSchema } from '../validators/common.js';

export const customerRouter = Router();

customerRouter.use(authenticate, authenticatedStaff);

customerRouter.get('/', validate(customerQuerySchema, 'query'), customerController.list);
customerRouter.get('/:id', validate(idParamSchema, 'params'), customerController.get);
customerRouter.post('/', canWriteCustomers, validate(customerBodySchema), customerController.create);
customerRouter.patch('/:id', canWriteCustomers, validate(idParamSchema, 'params'), validate(customerUpdateSchema), customerController.update);
customerRouter.delete('/:id', adminOnly, validate(idParamSchema, 'params'), customerController.remove);
