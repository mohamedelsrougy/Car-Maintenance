import type { FilterQuery } from 'mongoose';
import { Vehicle } from '../models/Vehicle.model.js';
import { escapeRegex } from '../validators/common.js';

export const vehicleRepository = {
  findById(id: string) {
    return Vehicle.findById(id).populate('customerId');
  },

  findByIdLean(id: string) {
    return Vehicle.findById(id);
  },

  findByVin(vin: string) {
    return Vehicle.findOne({ vin: vin.toUpperCase() }).populate('customerId');
  },

  findByPlate(plateNumber: string) {
    return Vehicle.findOne({ plateNumber: plateNumber.toUpperCase() }).populate('customerId');
  },

  findByVinOrPlate(vin?: string, plate?: string) {
    if (vin) {
      return Vehicle.findOne({ vin: vin.toUpperCase() }).populate('customerId');
    }
    if (plate) {
      return Vehicle.findOne({ plateNumber: plate.toUpperCase() }).populate('customerId');
    }
    return null;
  },

  findByCustomer(customerId: string) {
    return Vehicle.find({ customerId }).sort({ createdAt: -1 });
  },

  search(params: {
    search?: string;
    plate?: string;
    vin?: string;
    customerId?: string;
    skip: number;
    limit: number;
  }) {
    const filter: FilterQuery<typeof Vehicle> = {};

    if (params.customerId) {
      filter.customerId = params.customerId;
    }
    if (params.plate) {
      filter.plateNumber = new RegExp(escapeRegex(params.plate), 'i');
    }
    if (params.vin) {
      filter.vin = new RegExp(escapeRegex(params.vin), 'i');
    }
    if (params.search && !params.plate && !params.vin) {
      const term = new RegExp(escapeRegex(params.search), 'i');
      filter.$or = [{ vin: term }, { plateNumber: term }, { make: term }, { model: term }];
    }

    return Promise.all([
      Vehicle.find(filter)
        .populate('customerId')
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit),
      Vehicle.countDocuments(filter),
    ]);
  },

  create(data: Record<string, unknown>) {
    return Vehicle.create(data);
  },
};
