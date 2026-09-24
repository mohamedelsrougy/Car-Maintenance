import type { FilterQuery } from 'mongoose';
import { JobCard } from '../models/JobCard.model.js';
import { JOB_STATUSES, type JobStatus } from '../types/enums.js';
import { escapeRegex } from '../validators/common.js';

const jobPopulate = [
  { path: 'vehicleId' },
  { path: 'customerId' },
  { path: 'advisorId', select: 'name email role' },
  { path: 'technicianId', select: 'name email role' },
  { path: 'items.partId', select: 'partNumber name stockQuantity sellingPrice' },
];

export const jobCardRepository = {
  populate(query: ReturnType<typeof JobCard.findById>) {
    return query.populate(jobPopulate);
  },

  findById(id: string) {
    return JobCard.findById(id).populate(jobPopulate);
  },

  findByIdRaw(id: string) {
    return JobCard.findById(id);
  },

  findByVehicle(vehicleId: string) {
    return JobCard.find({ vehicleId }).sort({ createdAt: -1 }).populate(jobPopulate);
  },

  search(params: {
    search?: string;
    status?: JobStatus;
    vehicleId?: string;
    customerId?: string;
    technicianId?: string;
    skip: number;
    limit: number;
  }) {
    const filter: FilterQuery<typeof JobCard> = {};

    if (params.status) {
      filter.status = params.status;
    }
    if (params.vehicleId) {
      filter.vehicleId = params.vehicleId;
    }
    if (params.customerId) {
      filter.customerId = params.customerId;
    }
    if (params.technicianId) {
      filter.technicianId = params.technicianId;
    }
    if (params.search) {
      filter.jobNumber = new RegExp(escapeRegex(params.search), 'i');
    }

    return Promise.all([
      JobCard.find(filter)
        .populate(jobPopulate)
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit),
      JobCard.countDocuments(filter),
    ]);
  },

  countByStatus() {
    return JobCard.aggregate<{ _id: JobStatus; count: number }>([
      { $match: { status: { $nin: ['COMPLETED', 'CANCELLED'] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  },

  listActive() {
    return JobCard.find({
      status: { $nin: ['COMPLETED', 'CANCELLED'] },
    })
      .populate(jobPopulate)
      .sort({ updatedAt: -1 })
      .limit(50);
  },

  board() {
    return JobCard.find({ status: { $ne: 'CANCELLED' } })
      .populate(jobPopulate)
      .sort({ updatedAt: -1 });
  },
};

export { JOB_STATUSES };
