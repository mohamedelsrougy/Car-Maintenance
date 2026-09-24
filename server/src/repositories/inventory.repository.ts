import type { FilterQuery } from 'mongoose';
import { InventoryItem } from '../models/InventoryItem.model.js';
import { escapeRegex } from '../validators/common.js';

export const inventoryRepository = {
  findById(id: string) {
    return InventoryItem.findById(id);
  },

  findLowStock() {
    return InventoryItem.find({
      $expr: { $lte: ['$stockQuantity', '$minThreshold'] },
    }).sort({ stockQuantity: 1, name: 1 });
  },

  search(params: { search?: string; category?: string; skip: number; limit: number }) {
    const filter: FilterQuery<typeof InventoryItem> = {};

    if (params.category) {
      filter.category = new RegExp(escapeRegex(params.category), 'i');
    }
    if (params.search) {
      const term = new RegExp(escapeRegex(params.search), 'i');
      filter.$or = [{ name: term }, { partNumber: term }, { category: term }];
    }

    return Promise.all([
      InventoryItem.find(filter).sort({ name: 1 }).skip(params.skip).limit(params.limit),
      InventoryItem.countDocuments(filter),
    ]);
  },

  create(data: Record<string, unknown>) {
    return InventoryItem.create(data);
  },
};
