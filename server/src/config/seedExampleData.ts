import { Customer } from '../models/Customer.model.js';
import { InventoryItem } from '../models/InventoryItem.model.js';
import { Invoice } from '../models/Invoice.model.js';
import { JobCard } from '../models/JobCard.model.js';
import { User } from '../models/User.model.js';
import { Vehicle } from '../models/Vehicle.model.js';
import { connectDatabase, disconnectDatabase } from './db.js';
import { ensureDemoUsers } from './seedUsers.js';

const DEMO_CUSTOMERS = [
  {
    fullName: 'Ahmed Hassan',
    phone: '+201012345678',
    email: 'ahmed.hassan@example.com',
    address: 'Nasr City, Cairo',
  },
  {
    fullName: 'Noura Ibrahim',
    phone: '+201198765432',
    email: 'noura.ibrahim@example.com',
    address: 'Dokki, Giza',
  },
  {
    fullName: 'Karim Saleh',
    phone: '+201155443322',
    email: 'karim.saleh@example.com',
    address: 'Mohandessin, Cairo',
  },
] as const;

const DEMO_VEHICLES = [
  {
    customerPhone: '+201012345678',
    vin: 'WVWZZZ1JZ3W123456',
    plateNumber: '123-أبج-4',
    make: 'Toyota',
    model: 'Corolla',
    year: 2022,
    engine: '1.8L 4-Cylinder',
    currentOdometer: 24850,
  },
  {
    customerPhone: '+201198765432',
    vin: '1HGBH41JXMN109186',
    plateNumber: '477-راب-3',
    make: 'Nissan',
    model: 'Sunny',
    year: 2021,
    engine: '1.6L 4-Cylinder',
    currentOdometer: 31540,
  },
  {
    customerPhone: '+201155443322',
    vin: 'JH4KA2650LC012345',
    plateNumber: '902-سكا-7',
    make: 'Kia',
    model: 'Cerato',
    year: 2023,
    engine: '1.6L Turbo',
    currentOdometer: 18420,
  },
] as const;

const DEMO_INVENTORY = [
  {
    partNumber: 'AIR-FLT-001',
    name: 'Engine Air Filter',
    category: 'Filters',
    costPrice: 320,
    sellingPrice: 520,
    stockQuantity: 16,
    minThreshold: 6,
  },
  {
    partNumber: 'OIL-FLT-002',
    name: 'Oil Filter',
    category: 'Filters',
    costPrice: 250,
    sellingPrice: 420,
    stockQuantity: 22,
    minThreshold: 8,
  },
  {
    partNumber: 'BRAKE-PAD-010',
    name: 'Brake Pads',
    category: 'Brakes',
    costPrice: 950,
    sellingPrice: 1500,
    stockQuantity: 12,
    minThreshold: 5,
  },
] as const;

export async function seedExampleData(options: { reset?: boolean } = {}): Promise<void> {
  const { reset = false } = options;

  if (reset) {
    await Promise.all([
      Customer.deleteMany({}),
      Vehicle.deleteMany({}),
      InventoryItem.deleteMany({}),
      JobCard.deleteMany({}),
      Invoice.deleteMany({}),
    ]);
  } else {
    const hasAnyCustomer = (await Customer.countDocuments()) > 0;
    const hasAnyVehicle = (await Vehicle.countDocuments()) > 0;
    const hasAnyInventory = (await InventoryItem.countDocuments()) > 0;
    const hasAnyJob = (await JobCard.countDocuments()) > 0;

    if (hasAnyCustomer || hasAnyVehicle || hasAnyInventory || hasAnyJob) {
      return;
    }
  }

  const createdCustomers = await Customer.insertMany(DEMO_CUSTOMERS);

  const createdVehicles = await Promise.all(
    DEMO_VEHICLES.map(async (vehicle) => {
      const customer = createdCustomers.find((entry) => entry.phone === vehicle.customerPhone);
      if (!customer) {
        throw new Error(`Missing customer record for ${vehicle.customerPhone}`);
      }

      return Vehicle.create({
        customerId: customer._id,
        vin: vehicle.vin,
        plateNumber: vehicle.plateNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        engine: vehicle.engine,
        currentOdometer: vehicle.currentOdometer,
      });
    }),
  );

  await InventoryItem.insertMany(DEMO_INVENTORY);

  const advisor = await User.findOne({ email: 'advisor@carservice.local' });
  const technician = await User.findOne({ email: 'tech@carservice.local' });

  if (!advisor || !technician) {
    throw new Error('Demo advisor and technician users are required before creating example jobs');
  }

  const firstCustomer = createdCustomers[0];
  const secondCustomer = createdCustomers[1];
  const firstVehicle = createdVehicles[0];
  const secondVehicle = createdVehicles[1];

  if (!firstCustomer || !secondCustomer || !firstVehicle || !secondVehicle) {
    throw new Error('Example customer or vehicle records were not created correctly');
  }

  const jobOne = await JobCard.create({
    vehicleId: firstVehicle._id,
    customerId: firstCustomer._id,
    advisorId: advisor._id,
    technicianId: technician._id,
    status: 'IN_PROGRESS',
    intakeInspection: {
      odometerIn: firstVehicle.currentOdometer,
      fuelLevel: '3/4',
      scratchesOrDents: ['Front bumper'],
      photos: [],
      clientNotes: 'Customer reports minor vibration while braking.',
    },
    items: [
      {
        type: 'PART',
        partId: null,
        description: 'Brake pads',
        quantity: 1,
        unitPrice: 1500,
        subtotal: 1500,
      },
      {
        type: 'LABOR',
        partId: null,
        description: 'Brake inspection and replacement',
        quantity: 2,
        unitPrice: 3200,
        subtotal: 6400,
      },
    ],
    estimateApproved: true,
  });

  const jobTwo = await JobCard.create({
    vehicleId: secondVehicle._id,
    customerId: secondCustomer._id,
    advisorId: advisor._id,
    technicianId: technician._id,
    status: 'READY_FOR_DELIVERY',
    intakeInspection: {
      odometerIn: secondVehicle.currentOdometer,
      fuelLevel: '1/2',
      scratchesOrDents: [],
      photos: [],
      clientNotes: 'Oil change and general check-up requested.',
    },
    items: [
      {
        type: 'PART',
        partId: null,
        description: 'Engine oil filter',
        quantity: 1,
        unitPrice: 420,
        subtotal: 420,
      },
      {
        type: 'LABOR',
        partId: null,
        description: 'Full service inspection',
        quantity: 1,
        unitPrice: 2200,
        subtotal: 2200,
      },
    ],
    estimateApproved: true,
  });

  await Invoice.create({
    jobCardId: jobOne._id,
    status: 'DRAFT',
    payments: [],
  });

  await Invoice.create({
    jobCardId: jobTwo._id,
    status: 'ISSUED',
    payments: [{ amount: 2620, method: 'CARD', transactionRef: 'TXN-1001', date: new Date() }],
  });
}

async function runSeedScript(): Promise<void> {
  await connectDatabase();
  await ensureDemoUsers();
  const shouldReset = process.argv.includes('--reset') || process.env.RESET_DEMO_DATA === 'true';
  await seedExampleData({ reset: shouldReset });
  console.log(shouldReset ? 'Demo data reset and reseeded successfully' : 'Example data seeded successfully');
  await disconnectDatabase();
}

if (require.main === module) {
  runSeedScript().catch((error) => {
    console.error('Failed to seed example data', error);
    process.exit(1);
  });
}
