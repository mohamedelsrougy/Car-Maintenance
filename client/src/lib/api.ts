import axios from 'axios';
import type { AuthResponse, CustomerRecord, InventoryItemRecord, InvoiceRecord, JobCard, PaginatedResponse, UserRecord, VehicleRecord } from '../types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  withCredentials: true,
});

export const loginUser = async (email: string, password: string) => {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data.user;
};

export const getCurrentUser = async () => {
  const response = await api.get<AuthResponse>('/auth/me');
  return response.data.user;
};

export const logoutUser = async () => {
  await api.post('/auth/logout');
};

export const getUsers = async () => {
  const response = await api.get<{ users: Array<UserRecord & { _id?: string }> }>('/auth/users');
  return response.data.users.map((user) => ({
    ...user,
    id: user.id ?? user._id ?? '',
    _id: undefined,
  }));
};

export const createUser = async (payload: { name: string; email: string; password: string; role: UserRecord['role'] }) => {
  const response = await api.post<{ user: UserRecord }>('/auth/users', payload);
  return response.data.user;
};

export const updateUser = async (id: string, payload: Partial<{ name: string; email: string; password: string; role: UserRecord['role'] }>) => {
  const response = await api.patch<{ user: UserRecord }>(`/auth/users/${id}`, payload);
  return response.data.user;
};

export const deleteUser = async (id: string) => {
  await api.delete(`/auth/users/${id}`);
};

export const getDashboardSummary = async () => {
  const response = await api.get('/dashboard/summary');
  return response.data;
};

export const getJobBoard = async () => {
  const response = await api.get('/jobs/board');
  return response.data;
};

export const getJobs = async () => {
  const response = await api.get<PaginatedResponse<JobCard>>('/jobs', { params: { page: 1, limit: 50 } });
  return response.data.items;
};

export const getInvoices = async () => {
  const response = await api.get<PaginatedResponse<InvoiceRecord>>('/invoices', { params: { page: 1, limit: 50 } });
  return response.data.items;
};

export const getCustomers = async () => {
  const response = await api.get<PaginatedResponse<CustomerRecord>>('/customers', {
    params: { page: 1, limit: 25 },
  });
  return response.data.items;
};

export const createCustomer = async (payload: Partial<CustomerRecord>) => {
  const response = await api.post<{ customer: CustomerRecord }>('/customers', payload);
  return response.data.customer;
};

export const updateCustomer = async (id: string, payload: Partial<CustomerRecord>) => {
  const response = await api.patch<{ customer: CustomerRecord }>(`/customers/${id}`, payload);
  return response.data.customer;
};

export const deleteCustomer = async (id: string) => {
  await api.delete(`/customers/${id}`);
};

export const getVehicles = async (customerId?: string) => {
  const response = await api.get<PaginatedResponse<VehicleRecord>>('/vehicles', {
    params: { page: 1, limit: 100, ...(customerId ? { customerId } : {}) },
  });
  return response.data.items;
};

export const createVehicle = async (payload: Partial<VehicleRecord> & { customerId: string }) => {
  const response = await api.post<{ vehicle: VehicleRecord }>('/vehicles', payload);
  return response.data.vehicle;
};

export const updateVehicle = async (id: string, payload: Partial<VehicleRecord> & { customerId?: string }) => {
  const response = await api.patch<{ vehicle: VehicleRecord }>(`/vehicles/${id}`, payload);
  return response.data.vehicle;
};

export const deleteVehicle = async (id: string) => {
  await api.delete(`/vehicles/${id}`);
};

export const getInventory = async () => {
  const response = await api.get<PaginatedResponse<InventoryItemRecord>>('/inventory', {
    params: { page: 1, limit: 100 },
  });
  return response.data.items;
};

export const createInventory = async (payload: Partial<InventoryItemRecord>) => {
  const response = await api.post<{ item: InventoryItemRecord }>('/inventory', payload);
  return response.data.item;
};

export const updateInventory = async (id: string, payload: Partial<InventoryItemRecord>) => {
  const response = await api.patch<{ item: InventoryItemRecord }>(`/inventory/${id}`, payload);
  return response.data.item;
};

export const deleteInventory = async (id: string) => {
  await api.delete(`/inventory/${id}`);
};

export const createJobIntake = async (payload: unknown) => {
  const response = await api.post<{ job: JobCard }>('/jobs/intake', payload);
  return response.data.job;
};

export const updateJob = async (id: string, payload: Partial<JobCard>) => {
  const response = await api.patch<{ job: JobCard }>(`/jobs/${id}`, payload);
  return response.data.job;
};

export const transitionJob = async (id: string, status: string) => {
  const response = await api.post<{ job: JobCard }>(`/jobs/${id}/status`, { status });
  return response.data.job;
};
