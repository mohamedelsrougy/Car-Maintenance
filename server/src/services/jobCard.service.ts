import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.model.js';
import { InventoryItem } from '../models/InventoryItem.model.js';
import { JobCard } from '../models/JobCard.model.js';
import { Vehicle } from '../models/Vehicle.model.js';
import { jobCardRepository } from '../repositories/jobCard.repository.js';
import { userDirectoryRepository } from '../repositories/userDirectory.repository.js';
import type { JobStatus, UserRole } from '../types/enums.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginatedResult } from '../utils/pagination.js';
import { withTransaction } from '../utils/withTransaction.js';

const EDITABLE_STATUSES: JobStatus[] = ['INTAKE', 'DIAGNOSING', 'WAITING_PARTS', 'IN_PROGRESS'];

export const JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  INTAKE: ['DIAGNOSING', 'CANCELLED'],
  DIAGNOSING: ['WAITING_PARTS', 'IN_PROGRESS', 'CANCELLED'],
  WAITING_PARTS: ['IN_PROGRESS', 'DIAGNOSING', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_PARTS', 'READY_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_DELIVERY: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: [],
  CANCELLED: [],
};

const ESTIMATE_TARGETS: JobStatus[] = ['WAITING_PARTS', 'IN_PROGRESS'];

type IntakeCustomer = { id: string } | { fullName: string; phone: string; email?: string; address?: string };
type IntakeVehicle =
  | { id: string }
  | {
      vin: string;
      plateNumber: string;
      make: string;
      model: string;
      year: number;
      engine?: string;
      currentOdometer?: number;
    };

function assertEditable(status: JobStatus) {
  if (!EDITABLE_STATUSES.includes(status)) {
    throw new ApiError(StatusCodes.CONFLICT, `Job card in ${status} cannot be edited`);
  }
}

function canTransition(role: UserRole, from: JobStatus, to: JobStatus, estimateApproved: boolean) {
  if (!JOB_TRANSITIONS[from].includes(to)) {
    throw new ApiError(StatusCodes.CONFLICT, `Cannot move job from ${from} to ${to}`);
  }

  if (to === 'CANCELLED' && role === 'technician') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only advisors or admins can cancel a job');
  }

  if (to === 'COMPLETED' && role === 'technician') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only advisors or admins can complete a job');
  }

  const requiresEstimate = ESTIMATE_TARGETS.includes(to) && (from === 'INTAKE' || from === 'DIAGNOSING');
  if (requiresEstimate && !estimateApproved && role !== 'admin' && role !== 'advisor') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Estimate must be approved by an advisor or admin');
  }
}

async function restorePartStock(
  session: mongoose.ClientSession,
  items: Array<{ type: string; partId?: unknown; quantity: number }>,
) {
  for (const item of items) {
    if (item.type !== 'PART' || !item.partId) {
      continue;
    }

    await InventoryItem.updateOne(
      { _id: item.partId },
      { $inc: { stockQuantity: item.quantity } },
      { session },
    );
  }
}

export const jobCardService = {
  async list(query: {
    page: number;
    limit: number;
    search?: string;
    status?: JobStatus;
    vehicleId?: string;
    customerId?: string;
    technicianId?: string;
  }) {
    const { skip, page, limit } = paginate(query.page, query.limit);
    const [items, total] = await jobCardRepository.search({ ...query, skip, limit });
    return paginatedResult(items, total, page, limit);
  },

  async board() {
    const jobs = await jobCardRepository.board();
    const columns = Object.fromEntries(
      (['INTAKE', 'DIAGNOSING', 'WAITING_PARTS', 'IN_PROGRESS', 'READY_FOR_DELIVERY', 'COMPLETED'] as JobStatus[]).map(
        (status) => [status, jobs.filter((job) => job.status === status)],
      ),
    );
    return { columns };
  },

  async getById(id: string) {
    const job = await jobCardRepository.findById(id);
    if (!job) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Job card not found');
    }
    return job;
  },

  async createIntake(
    advisorId: string,
    input: {
      customer: IntakeCustomer;
      vehicle: IntakeVehicle;
      technicianId?: string | null;
      intakeInspection: {
        odometerIn: number;
        fuelLevel: string;
        scratchesOrDents: string[];
        photos: string[];
        clientNotes?: string;
      };
    },
  ) {
    return withTransaction(async (session) => {
      let customerId: mongoose.Types.ObjectId;
      let vehicleId: mongoose.Types.ObjectId;

      if ('id' in input.customer) {
        const customer = await Customer.findById(input.customer.id).session(session);
        if (!customer) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
        }
        customerId = customer._id;
      } else {
        const existing = await Customer.findOne({ phone: input.customer.phone }).session(session);
        if (existing) {
          existing.set({
            fullName: input.customer.fullName,
            email: input.customer.email ?? existing.email,
            address: input.customer.address ?? existing.address,
          });
          await existing.save({ session });
          customerId = existing._id;
        } else {
          const [created] = await Customer.create(
            [
              {
                fullName: input.customer.fullName,
                phone: input.customer.phone,
                email: input.customer.email ?? '',
                address: input.customer.address ?? '',
              },
            ],
            { session },
          );
          if (!created) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create customer');
          }
          customerId = created._id;
        }
      }

      if ('id' in input.vehicle) {
        const vehicle = await Vehicle.findById(input.vehicle.id).session(session);
        if (!vehicle) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Vehicle not found');
        }
        if (String(vehicle.customerId) !== String(customerId)) {
          throw new ApiError(StatusCodes.CONFLICT, 'Vehicle does not belong to this customer');
        }
        vehicle.currentOdometer = Math.max(vehicle.currentOdometer, input.intakeInspection.odometerIn);
        await vehicle.save({ session });
        vehicleId = vehicle._id;
      } else {
        const [created] = await Vehicle.create(
          [
            {
              customerId,
              vin: input.vehicle.vin.toUpperCase(),
              plateNumber: input.vehicle.plateNumber.toUpperCase(),
              make: input.vehicle.make,
              model: input.vehicle.model,
              year: input.vehicle.year,
              engine: input.vehicle.engine ?? '',
              currentOdometer: input.vehicle.currentOdometer ?? input.intakeInspection.odometerIn,
            },
          ],
          { session },
        );
        if (!created) {
          throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create vehicle');
        }
        vehicleId = created._id;
      }

      if (input.technicianId) {
        const technician = await userDirectoryRepository.findActiveByIdAndRole(input.technicianId, 'technician');
        if (!technician) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Technician not found or inactive');
        }
      }

      const [job] = await JobCard.create(
        [
          {
            vehicleId,
            customerId,
            advisorId,
            technicianId: input.technicianId ?? null,
            status: 'INTAKE',
            intakeInspection: input.intakeInspection,
          },
        ],
        { session },
      );

      if (!job) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create job card');
      }

      return job;
    }).then((job) => jobCardRepository.findById(String(job._id)));
  },

  async update(
    id: string,
    input: { technicianId?: string | null; tax?: number; discount?: number },
  ) {
    const job = await jobCardRepository.findByIdRaw(id);
    if (!job) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Job card not found');
    }
    assertEditable(job.status);

    if (input.technicianId) {
      const technician = await userDirectoryRepository.findActiveByIdAndRole(input.technicianId, 'technician');
      if (!technician) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Technician not found or inactive');
      }
      job.technicianId = technician._id;
    } else if (input.technicianId === null) {
      job.technicianId = null;
    }

    if (input.tax !== undefined) {
      job.totals.tax = input.tax;
    }
    if (input.discount !== undefined) {
      job.totals.discount = input.discount;
    }

    await job.save();
    return this.getById(id);
  },

  async addItem(
    id: string,
    role: UserRole,
    item:
      | { type: 'PART'; partId: string; quantity: number; description?: string; unitPrice?: number }
      | { type: 'LABOR'; description: string; quantity: number; unitPrice: number },
  ) {
    if (item.type === 'PART' && role === 'technician') {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Technicians cannot add parts');
    }

    return withTransaction(async (session) => {
      const job = await JobCard.findById(id).session(session);
      if (!job) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Job card not found');
      }
      assertEditable(job.status);

      if (item.type === 'PART') {
        const updatedPart = await InventoryItem.findOneAndUpdate(
          { _id: item.partId, stockQuantity: { $gte: item.quantity } },
          { $inc: { stockQuantity: -item.quantity } },
          { new: true, session },
        );

        if (!updatedPart) {
          const part = await InventoryItem.findById(item.partId).session(session);
          if (!part) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Part not found');
          }
          throw new ApiError(
            StatusCodes.CONFLICT,
            `Insufficient stock for ${part.partNumber}. Available: ${part.stockQuantity}`,
          );
        }

        job.items.push({
          type: 'PART',
          partId: updatedPart._id,
          description: item.description ?? updatedPart.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? updatedPart.sellingPrice,
          subtotal: 0,
        });
      } else {
        job.items.push({
          type: 'LABOR',
          partId: null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: 0,
        });
      }

      await job.save({ session });
      return job._id;
    }).then((jobId) => this.getById(String(jobId)));
  },

  async removeItem(id: string, itemId: string, role: UserRole) {
    if (role === 'technician') {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Technicians cannot remove billed items');
    }

    return withTransaction(async (session) => {
      const job = await JobCard.findById(id).session(session);
      if (!job) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Job card not found');
      }
      assertEditable(job.status);

      const item = job.items.id(itemId);
      if (!item) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Job item not found');
      }

      if (item.type === 'PART' && item.partId) {
        await InventoryItem.updateOne(
          { _id: item.partId },
          { $inc: { stockQuantity: item.quantity } },
          { session },
        );
      }

      item.deleteOne();
      await job.save({ session });
      return job._id;
    }).then((jobId) => this.getById(String(jobId)));
  },

  async transition(id: string, role: UserRole, nextStatus: JobStatus) {
    return withTransaction(async (session) => {
      const job = await JobCard.findById(id).session(session);
      if (!job) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Job card not found');
      }

      canTransition(role, job.status, nextStatus, job.estimateApproved);

      if (nextStatus === 'CANCELLED') {
        await restorePartStock(session, job.items);
      }

      if ((role === 'admin' || role === 'advisor') && ESTIMATE_TARGETS.includes(nextStatus)) {
        job.estimateApproved = true;
      }

      job.status = nextStatus;
      await job.save({ session });
      return job._id;
    }).then((jobId) => this.getById(String(jobId)));
  },

  async approveEstimate(id: string, nextStatus?: 'WAITING_PARTS' | 'IN_PROGRESS') {
    return withTransaction(async (session) => {
      const job = await JobCard.findById(id).session(session);
      if (!job) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Job card not found');
      }

      if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
        throw new ApiError(StatusCodes.CONFLICT, 'Cannot approve a closed job');
      }

      job.estimateApproved = true;
      if (nextStatus) {
        canTransition('advisor', job.status, nextStatus, true);
        job.status = nextStatus;
      }

      await job.save({ session });
      return job._id;
    }).then((jobId) => this.getById(String(jobId)));
  },
};
