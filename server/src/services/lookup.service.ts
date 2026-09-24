import { StatusCodes } from 'http-status-codes';
import { customerRepository } from '../repositories/customer.repository.js';
import { vehicleRepository } from '../repositories/vehicle.repository.js';
import { ApiError } from '../utils/ApiError.js';

export const lookupService = {
  async find(query: { q?: string; phone?: string; plate?: string; vin?: string }) {
    const phone = query.phone ?? query.q;
    const plate = query.plate ?? query.q;
    const vin = query.vin ?? query.q;

    const [customerByPhone, vehicleByPlate, vehicleByVin] = await Promise.all([
      phone ? customerRepository.findByPhone(phone) : null,
      plate ? vehicleRepository.findByPlate(plate) : null,
      vin ? vehicleRepository.findByVin(vin) : null,
    ]);

    const vehicle = vehicleByVin ?? vehicleByPlate;
    let customer = customerByPhone;

    if (!customer && vehicle?.customerId && typeof vehicle.customerId === 'object' && '_id' in vehicle.customerId) {
      customer = await customerRepository.findById(String(vehicle.customerId._id));
    }

    const vehicles = customer ? await vehicleRepository.findByCustomer(String(customer._id)) : vehicle ? [vehicle] : [];

    if (!customer && !vehicle) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No customer or vehicle matched');
    }

    return { customer, vehicles, matchedVehicle: vehicle };
  },
};
