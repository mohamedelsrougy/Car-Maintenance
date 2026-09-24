import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from './common.js';

export const vehicleBodySchema = z.object({
  customerId: objectIdSchema,
  vin: z.string().trim().min(5).max(32),
  plateNumber: z.string().trim().min(2).max(20),
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.coerce.number().int().min(1900).max(2100),
  engine: z.string().trim().max(80).optional().or(z.literal('')),
  currentOdometer: z.coerce.number().min(0).default(0),
});

export const vehicleUpdateSchema = vehicleBodySchema.partial();

export const vehicleQuerySchema = paginationQuerySchema.extend({
  plate: z.string().trim().optional(),
  vin: z.string().trim().optional(),
  customerId: objectIdSchema.optional(),
});

export const vehicleHistoryQuerySchema = z
  .object({
    plate: z.string().trim().optional(),
    vin: z.string().trim().optional(),
  })
  .refine((value) => Boolean(value.plate || value.vin), {
    message: 'Provide plate or vin',
  });
