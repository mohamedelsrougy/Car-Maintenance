import { Router } from 'express';
import { invoiceController } from '../controllers/invoice.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authenticatedStaff, canIssueInvoices, canRecordPayments } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.js';
import { createInvoiceSchema, invoiceQuerySchema, recordPaymentSchema } from '../validators/invoice.schema.js';

export const invoiceRouter = Router();

invoiceRouter.use(authenticate, authenticatedStaff);

invoiceRouter.get('/', validate(invoiceQuerySchema, 'query'), invoiceController.list);
invoiceRouter.get('/:id', validate(idParamSchema, 'params'), invoiceController.get);
invoiceRouter.post('/', canIssueInvoices, validate(createInvoiceSchema), invoiceController.create);
invoiceRouter.post('/:id/issue', canIssueInvoices, validate(idParamSchema, 'params'), invoiceController.issue);
invoiceRouter.post(
  '/:id/payments',
  canRecordPayments,
  validate(idParamSchema, 'params'),
  validate(recordPaymentSchema),
  invoiceController.recordPayment,
);
