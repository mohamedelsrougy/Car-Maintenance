import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { adminOnly, authenticatedStaff, canWriteInventory } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.js';
import { inventoryBodySchema, inventoryQuerySchema, inventoryUpdateSchema } from '../validators/inventory.schema.js';

export const inventoryRouter = Router();

inventoryRouter.use(authenticate, authenticatedStaff);

inventoryRouter.get('/low-stock', inventoryController.lowStock);
inventoryRouter.get('/', validate(inventoryQuerySchema, 'query'), inventoryController.list);
inventoryRouter.get('/:id', validate(idParamSchema, 'params'), inventoryController.get);
inventoryRouter.post('/', canWriteInventory, validate(inventoryBodySchema), inventoryController.create);
inventoryRouter.patch('/:id', canWriteInventory, validate(idParamSchema, 'params'), validate(inventoryUpdateSchema), inventoryController.update);
inventoryRouter.delete('/:id', adminOnly, validate(idParamSchema, 'params'), inventoryController.remove);
