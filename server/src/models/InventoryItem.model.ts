import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const inventoryItemSchema = new Schema(
  {
    partNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    minThreshold: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

inventoryItemSchema.index({ name: 'text', partNumber: 'text' });
inventoryItemSchema.index({ stockQuantity: 1, minThreshold: 1 });

inventoryItemSchema.virtual('isLowStock').get(function isLowStock() {
  return this.stockQuantity <= this.minThreshold;
});

inventoryItemSchema.set('toJSON', { virtuals: true });
inventoryItemSchema.set('toObject', { virtuals: true });

export type InventoryItem = InferSchemaType<typeof inventoryItemSchema>;
export const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
