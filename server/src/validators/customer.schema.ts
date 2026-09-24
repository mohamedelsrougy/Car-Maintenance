import { z } from 'zod';
import { paginationQuerySchema } from './common.js';

export const customerBodySchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(6).max(32),
  email: z.string().trim().email().toLowerCase().optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
});

export const customerUpdateSchema = customerBodySchema.partial();

export const customerQuerySchema = paginationQuerySchema.extend({
  phone: z.string().trim().optional(),
});
