import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
