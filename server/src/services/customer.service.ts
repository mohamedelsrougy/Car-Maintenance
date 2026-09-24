import { StatusCodes } from 'http-status-codes';
import { customerRepository } from '../repositories/customer.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginatedResult } from '../utils/pagination.js';

export const customerService = {
  async list(query: { page: number; limit: number; search?: string; phone?: string }) {
    const { skip, page, limit } = paginate(query.page, query.limit);
    const [items, total] = await customerRepository.search({
      search: query.search,
      phone: query.phone,
      skip,
      limit,
    });
    return paginatedResult(items, total, page, limit);
  },

  async getById(id: string) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
    }
    return customer;
  },

  async create(input: { fullName: string; phone: string; email?: string; address?: string }) {
    const existing = await customerRepository.findByPhone(input.phone);
    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, 'A customer with this phone already exists');
    }
    return customerRepository.create(input);
  },

  async update(id: string, input: Partial<{ fullName: string; phone: string; email: string; address: string }>) {
    const customer = await this.getById(id);
    if (input.phone && input.phone !== customer.phone) {
      const taken = await customerRepository.findByPhone(input.phone);
      if (taken) {
        throw new ApiError(StatusCodes.CONFLICT, 'A customer with this phone already exists');
      }
    }
    customer.set(input);
    return customer.save();
  },

  async remove(id: string) {
    const customer = await this.getById(id);
    await customer.deleteOne();
  },
};
