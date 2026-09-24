import type { Role } from '../types';

export const ROLE_ACCESS: Record<string, Role[]> = {
  dashboard: ['admin', 'advisor', 'technician', 'cashier'],
  customers: ['admin', 'advisor', 'cashier'],
  vehicles: ['admin', 'advisor', 'technician', 'cashier'],
  intake: ['admin', 'advisor'],
  jobs: ['admin', 'advisor', 'technician'],
  invoice: ['admin', 'advisor', 'cashier'],
  inventory: ['admin'],
  users: ['admin'],
};

export function canAccess(role: Role, route: string) {
  return ROLE_ACCESS[route]?.includes(role) ?? true;
}
