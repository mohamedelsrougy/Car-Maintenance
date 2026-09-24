export const USER_ROLES = ['admin', 'advisor', 'technician', 'cashier'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const JOB_STATUSES = [
  'INTAKE',
  'DIAGNOSING',
  'WAITING_PARTS',
  'IN_PROGRESS',
  'READY_FOR_DELIVERY',
  'COMPLETED',
  'CANCELLED',
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_ITEM_TYPES = ['PART', 'LABOR'] as const;
export type JobItemType = (typeof JOB_ITEM_TYPES)[number];

export const INVOICE_STATUSES = ['DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
