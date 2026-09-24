import { z } from 'zod';

export const lookupQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    plate: z.string().trim().optional(),
    vin: z.string().trim().optional(),
  })
  .refine((value) => Boolean(value.q || value.phone || value.plate || value.vin), {
    message: 'Provide q, phone, plate, or vin',
  });
