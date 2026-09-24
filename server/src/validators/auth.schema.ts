import { z } from 'zod';
import { USER_ROLES } from '../types/enums.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.enum(USER_ROLES),
});

export const userUpdateSchema = registerSchema.partial();

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});
