import { z } from 'zod';
import { paginationQuerySchema } from './common.js';

export const inventoryBodySchema = z.object({
  partNumber: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  minThreshold: z.coerce.number().int().min(0).default(0),
});

export const inventoryUpdateSchema = inventoryBodySchema.partial();

export const inventoryQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().optional(),
});
