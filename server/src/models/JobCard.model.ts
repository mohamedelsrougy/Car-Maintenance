import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { JOB_ITEM_TYPES, JOB_STATUSES } from '../types/enums.js';
import { Counter } from './Counter.model.js';

const intakeInspectionSchema = new Schema(
  {
    odometerIn: { type: Number, required: true, min: 0 },
    fuelLevel: { type: String, required: true, trim: true },
    scratchesOrDents: { type: [String], default: [] },
    photos: { type: [String], default: [] },
    clientNotes: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const jobItemSchema = new Schema(
  {
    type: { type: String, enum: JOB_ITEM_TYPES, required: true },
    partId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', default: null },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const totalsSchema = new Schema(
  {
    totalParts: { type: Number, required: true, min: 0, default: 0 },
    totalLabor: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    grandTotal: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const jobCardSchema = new Schema(
  {
    jobNumber: { type: String, unique: true, required: true, index: true },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    advisorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    technicianId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: JOB_STATUSES,
      required: true,
      default: 'INTAKE',
      index: true,
    },
    intakeInspection: { type: intakeInspectionSchema, required: true },
    items: { type: [jobItemSchema], default: [] },
    totals: { type: totalsSchema, required: true, default: () => ({}) },
    estimateApproved: { type: Boolean, required: true, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

jobCardSchema.index({ customerId: 1, createdAt: -1 });
jobCardSchema.index({ vehicleId: 1, createdAt: -1 });
jobCardSchema.index({ status: 1, createdAt: -1 });

jobCardSchema.pre('validate', function computeItemSubtotals() {
  for (const item of this.items) {
    item.subtotal = Number((item.quantity * item.unitPrice).toFixed(2));
  }
});

jobCardSchema.pre('validate', function computeTotals() {
  const totalParts = this.items
    .filter((item) => item.type === 'PART')
    .reduce((sum, item) => sum + item.subtotal, 0);
  const totalLabor = this.items
    .filter((item) => item.type === 'LABOR')
    .reduce((sum, item) => sum + item.subtotal, 0);

  this.totals.totalParts = Number(totalParts.toFixed(2));
  this.totals.totalLabor = Number(totalLabor.toFixed(2));

  const tax = this.totals.tax ?? 0;
  const discount = this.totals.discount ?? 0;
  this.totals.grandTotal = Number((totalParts + totalLabor + tax - discount).toFixed(2));
});

jobCardSchema.pre('validate', async function assignJobNumber() {
  if (this.jobNumber) {
    return;
  }

  const session = this.$session();
  const seq = await Counter.getNextSequence('jobCard', session ?? undefined);
  this.jobNumber = `JC-${String(seq).padStart(6, '0')}`;
});

jobCardSchema.pre('save', function stampCompletion() {
  if (this.isModified('status') && this.status === 'COMPLETED' && !this.completedAt) {
    this.completedAt = new Date();
  }
});

export type JobCard = InferSchemaType<typeof jobCardSchema>;
export const JobCard = mongoose.model('JobCard', jobCardSchema);
