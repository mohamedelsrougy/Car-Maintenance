export type Role = 'admin' | 'advisor' | 'technician' | 'cashier';

export type JobStatus =
  | 'INTAKE'
  | 'DIAGNOSING'
  | 'WAITING_PARTS'
  | 'IN_PROGRESS'
  | 'READY_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

export type CustomerLite = {
  _id?: string;
  fullName?: string;
  phone?: string;
};

export type VehicleLite = {
  _id?: string;
  plateNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  currentOdometer?: number;
};

export type UserLite = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
};

export type JobCardItem = {
  type?: 'PART' | 'LABOR';
  description?: string;
  quantity?: number;
  unitPrice?: number;
  subtotal?: number;
  partId?: { partNumber?: string; name?: string; stockQuantity?: number; sellingPrice?: number } | null;
};

export type JobCard = {
  _id: string;
  jobNumber?: string;
  status: JobStatus;
  customerId?: CustomerLite;
  vehicleId?: VehicleLite;
  advisorId?: UserLite;
  technicianId?: UserLite | null;
  intakeInspection?: {
    odometerIn?: number;
    fuelLevel?: string;
    scratchesOrDents?: string[];
    clientNotes?: string;
  };
  items?: JobCardItem[];
  totals?: {
    totalParts?: number;
    totalLabor?: number;
    tax?: number;
    discount?: number;
    grandTotal?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type DashboardSummary = {
  activeCars: number;
  todayRevenue: number;
  lowStockCount: number;
  jobsByStatus: Record<string, number>;
  activeJobs: JobCard[];
};

export type JobBoardResponse = {
  columns: Record<string, JobCard[]>;
};

export type InvoiceRecord = {
  _id: string;
  jobCardId?: JobCard;
  invoiceNumber?: string;
  status?: string;
  payments?: Array<{ amount: number; method: string; date?: string }>;
  amountPaid?: number;
  createdAt?: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
};

export type UserRecord = AuthUser;

export type CustomerRecord = {
  _id?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type InventoryItemRecord = {
  _id?: string;
  partNumber?: string;
  name?: string;
  category?: string;
  costPrice?: number;
  sellingPrice?: number;
  stockQuantity?: number;
  minThreshold?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type VehicleRecord = {
  _id?: string;
  customerId?: {
    _id?: string;
    fullName?: string;
    phone?: string;
  } | null;
  vin?: string;
  plateNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  currentOdometer?: number;
  engine?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type AuthResponse = {
  user: AuthUser;
};
