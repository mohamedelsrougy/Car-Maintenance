import { z } from 'zod';
import { JOB_STATUSES } from '../types/enums.js';
import { objectIdSchema, paginationQuerySchema } from './common.js';

export const intakeInspectionSchema = z.object({
  odometerIn: z.coerce.number().min(0),
  fuelLevel: z.string().trim().min(1).max(40),
  scratchesOrDents: z.array(z.string().trim().min(1)).default([]),
  photos: z.array(z.string().trim().min(1)).default([]),
  clientNotes: z.string().trim().max(2000).optional().or(z.literal('')),
});

const existingCustomerSchema = z.object({ id: objectIdSchema });
const newCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(6).max(32),
  email: z.string().trim().email().toLowerCase().optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
});

const existingVehicleSchema = z.object({ id: objectIdSchema });
const newVehicleSchema = z.object({
  vin: z.string().trim().min(5).max(32),
  plateNumber: z.string().trim().min(2).max(20),
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.coerce.number().int().min(1900).max(2100),
  engine: z.string().trim().max(80).optional().or(z.literal('')),
  currentOdometer: z.coerce.number().min(0).optional(),
});

export const createIntakeSchema = z.object({
  customer: z.union([existingCustomerSchema, newCustomerSchema]),
  vehicle: z.union([existingVehicleSchema, newVehicleSchema]),
  technicianId: objectIdSchema.optional().nullable(),
  intakeInspection: intakeInspectionSchema,
});

export const jobQuerySchema = paginationQuerySchema.extend({
  status: z.enum(JOB_STATUSES).optional(),
  vehicleId: objectIdSchema.optional(),
  customerId: objectIdSchema.optional(),
  technicianId: objectIdSchema.optional(),
});

export const addJobItemSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PART'),
    partId: objectIdSchema,
    quantity: z.coerce.number().min(0.01),
    description: z.string().trim().min(1).max(200).optional(),
    unitPrice: z.coerce.number().min(0).optional(),
  }),
  z.object({
    type: z.literal('LABOR'),
    description: z.string().trim().min(1).max(200),
    quantity: z.coerce.number().min(0.01),
    unitPrice: z.coerce.number().min(0),
  }),
]);

export const updateJobSchema = z.object({
  technicianId: objectIdSchema.optional().nullable(),
  tax: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional(),
});

export const transitionJobSchema = z.object({
  status: z.enum(JOB_STATUSES),
});

export const approveEstimateSchema = z.object({
  nextStatus: z.enum(['WAITING_PARTS', 'IN_PROGRESS']).optional(),
});

export const jobItemParamsSchema = z.object({
  id: objectIdSchema,
  itemId: objectIdSchema,
});
