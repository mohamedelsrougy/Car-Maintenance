import { Router } from 'express';
import { jobCardController } from '../controllers/jobCard.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authenticatedStaff, canCreateJobs, canManageEstimates } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.js';
import {
  addJobItemSchema,
  approveEstimateSchema,
  createIntakeSchema,
  jobItemParamsSchema,
  jobQuerySchema,
  transitionJobSchema,
  updateJobSchema,
} from '../validators/jobCard.schema.js';

export const jobCardRouter = Router();

jobCardRouter.use(authenticate, authenticatedStaff);

jobCardRouter.get('/board', jobCardController.board);
jobCardRouter.get('/', validate(jobQuerySchema, 'query'), jobCardController.list);
jobCardRouter.get('/:id', validate(idParamSchema, 'params'), jobCardController.get);
jobCardRouter.post('/intake', canCreateJobs, validate(createIntakeSchema), jobCardController.createIntake);
jobCardRouter.patch('/:id', canCreateJobs, validate(idParamSchema, 'params'), validate(updateJobSchema), jobCardController.update);
jobCardRouter.post('/:id/items', validate(idParamSchema, 'params'), validate(addJobItemSchema), jobCardController.addItem);
jobCardRouter.delete('/:id/items/:itemId', validate(jobItemParamsSchema, 'params'), jobCardController.removeItem);
jobCardRouter.post('/:id/status', validate(idParamSchema, 'params'), validate(transitionJobSchema), jobCardController.transition);
jobCardRouter.post(
  '/:id/approve',
  canManageEstimates,
  validate(idParamSchema, 'params'),
  validate(approveEstimateSchema),
  jobCardController.approve,
);
