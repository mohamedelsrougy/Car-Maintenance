import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { INVOICE_STATUSES, PAYMENT_METHODS } from '../types/enums.js';
import { Counter } from './Counter.model.js';

const paymentSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    transactionRef: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now },
  },
  { _id: true },
);

const invoiceSchema = new Schema(
  {
    jobCardId: {
      type: Schema.Types.ObjectId,
      ref: 'JobCard',
      required: true,
      unique: true,
      index: true,
    },
    invoiceNumber: { type: String, unique: true, required: true, index: true },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      required: true,
      default: 'DRAFT',
      index: true,
    },
    payments: { type: [paymentSchema], default: [] },
  },
  { timestamps: true },
);

invoiceSchema.virtual('amountPaid').get(function amountPaid() {
  return this.payments.reduce((sum, payment) => sum + payment.amount, 0);
});

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

invoiceSchema.pre('validate', async function assignInvoiceNumber() {
  if (this.invoiceNumber) {
    return;
  }

  const session = this.$session();
  const seq = await Counter.getNextSequence('invoice', session ?? undefined);
  this.invoiceNumber = `INV-${String(seq).padStart(6, '0')}`;
});

export type Invoice = InferSchemaType<typeof invoiceSchema>;
export const Invoice = mongoose.model('Invoice', invoiceSchema);
