import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const vehicleSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    vin: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1900, max: 2100 },
    engine: { type: String, trim: true, default: '' },
    currentOdometer: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

vehicleSchema.index({ make: 1, model: 1 });

export type Vehicle = InferSchemaType<typeof vehicleSchema>;
export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
