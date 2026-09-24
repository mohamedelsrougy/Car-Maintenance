import type { FilterQuery } from 'mongoose';
import { Customer } from '../models/Customer.model.js';
import { escapeRegex } from '../validators/common.js';

export const customerRepository = {
  findById(id: string) {
    return Customer.findById(id);
  },

  findByPhone(phone: string) {
    return Customer.findOne({ phone });
  },

  search(params: { search?: string; phone?: string; skip: number; limit: number }) {
    const filter: FilterQuery<typeof Customer> = {};

    if (params.phone) {
      filter.phone = new RegExp(escapeRegex(params.phone), 'i');
    } else if (params.search) {
      const term = new RegExp(escapeRegex(params.search), 'i');
      filter.$or = [{ fullName: term }, { phone: term }, { email: term }];
    }

    return Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(params.skip).limit(params.limit),
      Customer.countDocuments(filter),
    ]);
  },

  create(data: { fullName: string; phone: string; email?: string; address?: string }) {
    return Customer.create(data);
  },
};
