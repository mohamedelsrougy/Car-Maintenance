import { StatusCodes } from 'http-status-codes';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginatedResult } from '../utils/pagination.js';

export const inventoryService = {
  async list(query: { page: number; limit: number; search?: string; category?: string }) {
    const { skip, page, limit } = paginate(query.page, query.limit);
    const [items, total] = await inventoryRepository.search({ ...query, skip, limit });
    return paginatedResult(items, total, page, limit);
  },

  async lowStock() {
    const items = await inventoryRepository.findLowStock();
    return { items, count: items.length };
  },

  async getById(id: string) {
    const item = await inventoryRepository.findById(id);
    if (!item) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inventory item not found');
    }
    return item;
  },

  async create(input: {
    partNumber: string;
    name: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
    stockQuantity?: number;
    minThreshold?: number;
  }) {
    return inventoryRepository.create({
      ...input,
      partNumber: input.partNumber.toUpperCase(),
    });
  },

  async update(
    id: string,
    input: Partial<{
      partNumber: string;
      name: string;
      category: string;
      costPrice: number;
      sellingPrice: number;
      stockQuantity: number;
      minThreshold: number;
    }>,
  ) {
    const item = await this.getById(id);
    item.set({
      ...input,
      ...(input.partNumber ? { partNumber: input.partNumber.toUpperCase() } : {}),
    });
    return item.save();
  },

  async remove(id: string) {
    const item = await this.getById(id);
    await item.deleteOne();
  },
};
