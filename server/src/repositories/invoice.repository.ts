import type { FilterQuery } from 'mongoose';
import { Invoice } from '../models/Invoice.model.js';
import type { InvoiceStatus } from '../types/enums.js';

const invoicePopulate = [
  {
    path: 'jobCardId',
    populate: [
      { path: 'customerId' },
      { path: 'vehicleId' },
    ],
  },
];

export const invoiceRepository = {
  findById(id: string) {
    return Invoice.findById(id).populate(invoicePopulate);
  },

  findByJobCard(jobCardId: string) {
    return Invoice.findOne({ jobCardId }).populate(invoicePopulate);
  },

  findByJobCards(jobCardIds: string[]) {
    return Invoice.find({ jobCardId: { $in: jobCardIds } }).sort({ createdAt: -1 });
  },

  search(params: { search?: string; status?: InvoiceStatus; jobCardId?: string; skip: number; limit: number }) {
    const filter: FilterQuery<typeof Invoice> = {};
    if (params.status) {
      filter.status = params.status;
    }
    if (params.jobCardId) {
      filter.jobCardId = params.jobCardId;
    }
    if (params.search) {
      filter.invoiceNumber = new RegExp(params.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    return Promise.all([
      Invoice.find(filter)
        .populate(invoicePopulate)
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit),
      Invoice.countDocuments(filter),
    ]);
  },
};
