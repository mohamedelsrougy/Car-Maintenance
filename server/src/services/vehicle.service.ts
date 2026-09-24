import { StatusCodes } from 'http-status-codes';
import { Invoice } from '../models/Invoice.model.js';
import { JobCard } from '../models/JobCard.model.js';
import { customerRepository } from '../repositories/customer.repository.js';
import { vehicleRepository } from '../repositories/vehicle.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginatedResult } from '../utils/pagination.js';

export const vehicleService = {
  async list(query: {
    page: number;
    limit: number;
    search?: string;
    plate?: string;
    vin?: string;
    customerId?: string;
  }) {
    const { skip, page, limit } = paginate(query.page, query.limit);
    const [items, total] = await vehicleRepository.search({ ...query, skip, limit });
    return paginatedResult(items, total, page, limit);
  },

  async getById(id: string) {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Vehicle not found');
    }
    return vehicle;
  },

  async create(input: {
    customerId: string;
    vin: string;
    plateNumber: string;
    make: string;
    model: string;
    year: number;
    engine?: string;
    currentOdometer?: number;
  }) {
    const customer = await customerRepository.findById(input.customerId);
    if (!customer) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
    }

    return vehicleRepository.create({
      ...input,
      vin: input.vin.toUpperCase(),
      plateNumber: input.plateNumber.toUpperCase(),
    });
  },

  async update(
    id: string,
    input: Partial<{
      customerId: string;
      vin: string;
      plateNumber: string;
      make: string;
      model: string;
      year: number;
      engine: string;
      currentOdometer: number;
    }>,
  ) {
    const vehicle = await vehicleRepository.findByIdLean(id);
    if (!vehicle) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Vehicle not found');
    }

    if (input.customerId) {
      const customer = await customerRepository.findById(input.customerId);
      if (!customer) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
      }
    }

    vehicle.set({
      ...input,
      ...(input.vin ? { vin: input.vin.toUpperCase() } : {}),
      ...(input.plateNumber ? { plateNumber: input.plateNumber.toUpperCase() } : {}),
    });
    await vehicle.save();
    return vehicleRepository.findById(id);
  },

  async remove(id: string) {
    const vehicle = await vehicleRepository.findByIdLean(id);
    if (!vehicle) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Vehicle not found');
    }
    await vehicle.deleteOne();
  },

  async history(query: { plate?: string; vin?: string }) {
    const vehicle = await vehicleRepository.findByVinOrPlate(query.vin, query.plate);
    if (!vehicle) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Vehicle not found');
    }

    const jobs = await JobCard.find({ vehicleId: vehicle._id })
      .populate('advisorId', 'name role')
      .populate('technicianId', 'name role')
      .sort({ createdAt: -1 });

    const invoices = await Invoice.find({
      jobCardId: { $in: jobs.map((job) => job._id) },
    }).sort({ createdAt: -1 });

    const invoiceByJob = new Map(invoices.map((invoice) => [String(invoice.jobCardId), invoice]));

    const timeline = jobs.flatMap((job) => {
      const events: Array<Record<string, unknown>> = [
        {
          type: 'JOB_CREATED',
          at: job.createdAt,
          jobNumber: job.jobNumber,
          status: job.status,
          totals: job.totals,
        },
      ];

      if (job.completedAt) {
        events.push({
          type: 'JOB_COMPLETED',
          at: job.completedAt,
          jobNumber: job.jobNumber,
          totals: job.totals,
        });
      }

      const invoice = invoiceByJob.get(String(job._id));
      if (invoice) {
        events.push({
          type: 'INVOICE',
          at: invoice.createdAt,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          payments: invoice.payments,
          amountPaid: invoice.payments.reduce((sum, payment) => sum + payment.amount, 0),
        });

        for (const payment of invoice.payments) {
          events.push({
            type: 'PAYMENT',
            at: payment.date,
            invoiceNumber: invoice.invoiceNumber,
            amount: payment.amount,
            method: payment.method,
          });
        }
      }

      return events;
    });

    timeline.sort((a, b) => new Date(String(b.at)).getTime() - new Date(String(a.at)).getTime());

    return {
      vehicle,
      customer: vehicle.customerId,
      jobs,
      invoices,
      timeline,
    };
  },
};
