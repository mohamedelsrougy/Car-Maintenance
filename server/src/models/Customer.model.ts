import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const customerSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 160 },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

customerSchema.index({ fullName: 'text' });

export type Customer = InferSchemaType<typeof customerSchema>;
export const Customer = mongoose.model('Customer', customerSchema);
