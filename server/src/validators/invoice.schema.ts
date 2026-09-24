import { z } from 'zod';
import { PAYMENT_METHODS } from '../types/enums.js';
import { objectIdSchema, paginationQuerySchema } from './common.js';

export const createInvoiceSchema = z.object({
  jobCardId: objectIdSchema,
});

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(PAYMENT_METHODS),
  transactionRef: z.string().trim().max(120).optional().or(z.literal('')),
  date: z.coerce.date().optional(),
});

export const invoiceQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID']).optional(),
  jobCardId: objectIdSchema.optional(),
});
