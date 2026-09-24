import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Boxes,
  CarFront,
  ClipboardList,
  ClipboardPenLine,
  DollarSign,
  Gauge,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  createCustomer,
  createInventory,
  createJobIntake,
  createVehicle,
  createUser,
  deleteCustomer,
  deleteInventory,
  deleteVehicle,
  getCurrentUser,
  getCustomers,
  getDashboardSummary,
  getInventory,
  getJobBoard,
  getJobs,
  getInvoices,
  getVehicles,
  getUsers,
  loginUser,
  logoutUser,
  updateCustomer,
  updateInventory,
  updateUser,
  updateVehicle,
  deleteUser,
} from './lib/api';
import type { AuthUser, CustomerRecord, DashboardSummary, InventoryItemRecord, InvoiceRecord, JobBoardResponse, JobCard, JobStatus, Role, UserRecord, VehicleRecord } from './types';

const STATUS_ORDER: JobStatus[] = [
  'INTAKE',
  'DIAGNOSING',
  'WAITING_PARTS',
  'IN_PROGRESS',
  'READY_FOR_DELIVERY',
  'COMPLETED',
  'CANCELLED',
];

const STATUS_COLORS: Record<JobStatus, string> = {
  INTAKE: 'bg-sky-100 text-sky-700',
  DIAGNOSING: 'bg-violet-100 text-violet-700',
  WAITING_PARTS: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  READY_FOR_DELIVERY: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-emerald-600 text-white',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

const ROLE_ACCESS: Record<string, Role[]> = {
  dashboard: ['admin', 'advisor', 'technician', 'cashier'],
  customers: ['admin', 'advisor', 'cashier'],
  vehicles: ['admin', 'advisor', 'technician', 'cashier'],
  intake: ['admin', 'advisor'],
  jobs: ['admin', 'advisor', 'technician'],
  invoice: ['admin', 'advisor', 'cashier'],
  inventory: ['admin'],
  users: ['admin'],
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

const ARABIC_LETTER_MAP: Record<string, string> = {
  A: 'أ', B: 'ب', C: 'س', D: 'د', E: 'ي', F: 'ف', G: 'ج', H: 'ه', I: 'إ', J: 'ي', K: 'ك', L: 'ل', M: 'م', N: 'ن', O: 'ع', P: 'ب', Q: 'ق', R: 'ر', S: 'س', T: 'ت', U: 'و', V: 'ف', W: 'و', X: 'ك', Y: 'ي', Z: 'ز',
};

function formatPlateNumber(value?: string) {
  if (!value) return '—';

  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!cleaned) return '—';

  const digits = cleaned.replace(/[^0-9]/g, '');
  const letters = cleaned.replace(/[^A-Za-z]/g, '');

  const arabicLetters = letters
    .split('')
    .map((letter) => ARABIC_LETTER_MAP[letter] ?? letter)
    .filter(Boolean);

  if (!arabicLetters.length && !digits) return '—';

  const letterText = arabicLetters.length ? arabicLetters.join(' ') : '';
  return digits && letterText ? `${digits} ${letterText}` : digits || letterText;
}

function formatEGP(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function canAccess(role: Role, route: string) {
  return ROLE_ACCESS[route]?.includes(role) ?? true;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof CarFront }) {
  return (
    <div className="stat-card card-hover rounded-2xl p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between relative z-10">
        <span className="text-sm text-slate-500">{label}</span>
        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="relative z-10 text-3xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function JobColumn({ title, jobs }: { title: JobStatus; jobs: JobCard[] }) {
  return (
    <div className="card-hover luxury-card min-w-[280px] flex-1 rounded-2xl p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h3>
        <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">{jobs.length}</span>
      </div>

      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
            No cars in this stage
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job._id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">{job.jobNumber ?? 'JOB'}</span>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${STATUS_COLORS[job.status]}`}>
                  {job.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-medium text-slate-800">{job.customerId?.fullName ?? 'Customer'}</p>
                <p>
                  {job.vehicleId?.make ?? 'Vehicle'} {job.vehicleId?.model ?? ''}
                </p>
                <p>{formatPlateNumber(job.vehicleId?.plateNumber ?? 'Plate N/A')}</p>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{job.items?.length ?? 0} line items</span>
                <span>{job.totals?.grandTotal ? formatEGP(job.totals.grandTotal) : formatEGP(0)}</span>
              </div>

              <div className="mt-3">
                <Link
                  to="/jobs"
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-slate-300"
                >
                  View job
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DashboardScreen({ user: _user }: { user: AuthUser }) {
  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  });

  const { data: board, isLoading: boardLoading } = useQuery<JobBoardResponse>({
    queryKey: ['job-board'],
    queryFn: getJobBoard,
  });

  const columnJobs = Object.fromEntries(
    STATUS_ORDER.map((status) => [status, board?.columns?.[status] ?? []]),
  ) as Record<JobStatus, JobCard[]>;

  return (
    <div className="mx-auto max-w-7xl p-6">
      <section className="dashboard-banner mb-6 rounded-3xl p-6 text-white">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="feature-pill mb-3">Cairo Auto Service</span>
            <h1 className="text-3xl font-black tracking-tight text-white">Egypt Fleet Performance</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-200">
              Live workshop insights, high-priority service vehicles, and fast delivery tracking across the network.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="gold-ring rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">24/7 Support</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">12 Branches</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">98% SLA</span>
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Cars" value={summary?.activeCars ?? 0} icon={CarFront} />
        <StatCard label="Today Revenue" value={summary ? formatEGP(summary.todayRevenue) : formatEGP(0)} icon={DollarSign} />
        <StatCard label="Low Stock" value={summary?.lowStockCount ?? 0} icon={ClipboardList} />
        <StatCard label="Jobs in Progress" value={summary?.activeJobs.length ?? 0} icon={Gauge} />
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="luxury-card rounded-2xl p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cairo Workshop Status</h2>
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="space-y-3">
            {Object.entries(summary?.jobsByStatus ?? {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>{status}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="luxury-card rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Operations Overview</h2>
            <Activity className="h-5 w-5 text-sky-500" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-sky-50 p-4">
              <p className="text-sm text-sky-700">Intake</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary?.jobsByStatus?.INTAKE ?? 0}</p>
            </div>
            <div className="rounded-xl bg-violet-50 p-4">
              <p className="text-sm text-violet-700">Diagnosing</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary?.jobsByStatus?.DIAGNOSING ?? 0}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Ready for delivery</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary?.jobsByStatus?.READY_FOR_DELIVERY ?? 0}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="luxury-card rounded-2xl p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold">Workshop Job Board</h2>
          </div>
          <span className="text-sm text-slate-500">{summaryLoading || boardLoading ? 'Loading...' : 'Live board'}</span>
        </div>

        <div className="overflow-x-auto">
          <div className="flex min-w-[1200px] gap-4">
            {STATUS_ORDER.map((status) => (
              <JobColumn key={status} title={status} jobs={columnJobs[status] ?? []} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function IntakePage({ user }: { user: AuthUser }) {
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    plate: '',
    make: '',
    model: '',
    year: '',
    issue: '',
    notes: '',
  });

  const createJobMutation = useMutation({
    mutationFn: async () =>
      createJobIntake({
        customer: {
          fullName: form.customerName,
          phone: form.phone,
        },
        vehicle: {
          vin: `VIN-${Date.now().toString().slice(-8)}`,
          plateNumber: form.plate,
          make: form.make,
          model: form.model,
          year: Number(form.year),
        },
        intakeInspection: {
          odometerIn: 35000,
          fuelLevel: 'Half',
          scratchesOrDents: [],
          photos: [],
          clientNotes: `${form.issue} ${form.notes}`,
        },
      }),
    onSuccess: () => {
      setSubmitted(true);
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['job-board'] });
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(false);
    await createJobMutation.mutateAsync();
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-600">Operations</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">New Vehicle Intake</h1>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          Ready for scheduling
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Customer name</label>
              <input
                value={form.customerName}
                onChange={(event) => handleChange('customerName', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
              <input
                value={form.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
                placeholder="e.g. +201012345678"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Plate</label>
              <input
                value={form.plate}
                onChange={(event) => handleChange('plate', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Make</label>
              <input
                value={form.make}
                onChange={(event) => handleChange('make', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Year</label>
              <input
                value={form.year}
                onChange={(event) => handleChange('year', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Model</label>
            <input
              value={form.model}
              onChange={(event) => handleChange('model', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Reported issue</label>
            <textarea
              rows={4}
              value={form.issue}
              onChange={(event) => handleChange('issue', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Advisor notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => handleChange('notes', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button type="button" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700">
              Save draft
            </button>
            <button type="submit" disabled={createJobMutation.isPending} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
              {createJobMutation.isPending ? 'Creating...' : 'Create job card'}
            </button>
          </div>

          {createJobMutation.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {createJobMutation.error instanceof Error ? createJobMutation.error.message : 'Unable to create job card'}
            </div>
          ) : null}

          {submitted ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Job card created for {form.customerName} • {form.plate}
            </div>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Inspection checklist</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>VIN verified</span><span className="text-emerald-600">✓</span></li>
              <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Keys collected</span><span className="text-emerald-600">✓</span></li>
              <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Photos captured</span><span className="text-amber-600">Pending</span></li>
              <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Estimate approved</span><span className="text-slate-500">Draft</span></li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Customer summary</h3>
            <dl className="space-y-3 text-sm text-slate-600">
              <div className="flex justify-between gap-3"><dt>Priority</dt><dd className="font-medium text-slate-900">Standard</dd></div>
              <div className="flex justify-between gap-3"><dt>Advisor</dt><dd className="font-medium text-slate-900">{user.name}</dd></div>
              <div className="flex justify-between gap-3"><dt>Arrival</dt><dd className="font-medium text-slate-900">Recorded on submit</dd></div>
            </dl>
          </div>
        </aside>
      </form>
    </div>
  );
}

function InventoryPage({ user: _user }: { user: AuthUser }) {
  const queryClient = useQueryClient();
  const { data: inventory = [], isLoading } = useQuery<InventoryItemRecord[]>({
    queryKey: ['inventory'],
    queryFn: getInventory,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    partNumber: '',
    name: '',
    category: '',
    costPrice: '',
    sellingPrice: '',
    stockQuantity: '',
    minThreshold: '',
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        partNumber: form.partNumber,
        name: form.name,
        category: form.category,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        stockQuantity: Number(form.stockQuantity),
        minThreshold: Number(form.minThreshold),
      };

      if (editingId) {
        return updateInventory(editingId, payload);
      }
      return createInventory(payload);
    },
    onSuccess: () => {
      setFormOpen(false);
      setEditingId(null);
      setForm({
        partNumber: '',
        name: '',
        category: '',
        costPrice: '',
        sellingPrice: '',
        stockQuantity: '',
        minThreshold: '',
      });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInventory(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const handleEdit = (item: { _id?: string; partNumber?: string; name?: string; category?: string; costPrice?: number; sellingPrice?: number; stockQuantity?: number; minThreshold?: number }) => {
    setFormOpen(false);
    setEditingId(item._id ?? null);
    setForm({
      partNumber: item.partNumber ?? '',
      name: item.name ?? '',
      category: item.category ?? '',
      costPrice: String(item.costPrice ?? 0),
      sellingPrice: String(item.sellingPrice ?? 0),
      stockQuantity: String(item.stockQuantity ?? 0),
      minThreshold: String(item.minThreshold ?? 0),
    });
    requestAnimationFrame(() => setFormOpen(true));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await upsertMutation.mutateAsync();
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-600">Warehouse</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Inventory Control</h1>
        </div>
        <button onClick={() => { setFormOpen(true); setEditingId(null); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">
          Add stock item
        </button>
      </div>

      {formOpen ? (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{editingId ? 'Edit item' : 'New inventory item'}</h2>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setFormOpen(false)} className="text-sm text-slate-500">Close</button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.partNumber} onChange={(e) => setForm((current) => ({ ...current, partNumber: e.target.value }))} placeholder="Part number" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Part name" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} placeholder="Category" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.stockQuantity} onChange={(e) => setForm((current) => ({ ...current, stockQuantity: e.target.value }))} placeholder="Stock quantity" type="number" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.costPrice} onChange={(e) => setForm((current) => ({ ...current, costPrice: e.target.value }))} placeholder="Cost price" type="number" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.sellingPrice} onChange={(e) => setForm((current) => ({ ...current, sellingPrice: e.target.value }))} placeholder="Selling price" type="number" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.minThreshold} onChange={(e) => setForm((current) => ({ ...current, minThreshold: e.target.value }))} placeholder="Min threshold" type="number" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
            <button type="submit" disabled={upsertMutation.isPending} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {upsertMutation.isPending ? 'Saving...' : editingId ? 'Update item' : 'Create item'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total SKUs</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{isLoading ? '...' : inventory.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Low stock</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{inventory.filter((item) => Number(item.stockQuantity ?? 0) <= Number(item.minThreshold ?? 0)).length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Inventory value</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{formatEGP(inventory.reduce((sum, item) => sum + Number(item.stockQuantity ?? 0) * Number(item.sellingPrice ?? 0), 0))}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Item</span>
          <span>SKU</span>
          <span>Category</span>
          <span>Stock</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {inventory.map((item) => {
          const low = Number(item.stockQuantity ?? 0) <= Number(item.minThreshold ?? 0);
          return (
            <div key={item._id ?? item.partNumber} className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-slate-200 px-5 py-4 text-sm text-slate-700 last:border-b-0">
              <div>
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">Reorder at {item.minThreshold ?? 0}</p>
              </div>
              <span>{item.partNumber}</span>
              <span>{item.category}</span>
              <span>{item.stockQuantity}</span>
              <span>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${low ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {low ? 'Low' : 'Healthy'}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleEdit(item)} className="text-xs font-medium text-sky-700">Edit</button>
                <button type="button" onClick={() => item._id && deleteMutation.mutate(item._id)} className="text-xs font-medium text-rose-700">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JobDetailPage({ user: _user }: { user: AuthUser }) {
  const { data: jobs = [], isLoading } = useQuery<JobCard[]>({ queryKey: ['jobs'], queryFn: getJobs });
  const job = jobs[0];

  if (isLoading) {
    return <div className="mx-auto max-w-6xl p-6 text-sm text-slate-500">Loading job cards...</div>;
  }

  if (!job) {
    return <div className="mx-auto max-w-6xl p-6"><div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No job cards have been created yet.</div></div>;
  }

  const labor = (job.items ?? []).filter((item) => item.type === 'LABOR');
  const parts = (job.items ?? []).filter((item) => item.type === 'PART');
  const laborTotal = job.totals?.totalLabor ?? labor.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0);
  const totalEstimate = job.totals?.grandTotal ?? 0;
  const customer = job.customerId;
  const vehicle = job.vehicleId;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-600">Job Card</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{job.jobNumber}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-violet-700">
            {job.status}
          </span>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Approve estimate</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Vehicle & customer</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Customer</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{customer?.fullName ?? 'Unknown customer'}</p>
                <p className="text-sm text-slate-600">{customer?.phone ?? '—'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Vehicle</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{vehicle ? `${vehicle.make} ${vehicle.model} • ${vehicle.year} • ${formatPlateNumber(vehicle.plateNumber)}` : 'Unknown vehicle'}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Problem summary</h2>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Reported issue</p>
              <p className="mt-2">{job.intakeInspection?.clientNotes || 'No issue notes recorded.'}</p>
              <p className="mt-4 font-medium text-slate-900">Advisor notes</p>
              <p className="mt-2">{job.intakeInspection?.clientNotes || 'No advisor notes recorded.'}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Estimate</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-[1.5fr_0.55fr_0.8fr] gap-3 border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Description</span>
                <span>Qty</span>
                <span className="text-right">Price</span>
              </div>

              {parts.map((item) => (
                <div key={item.description} className="grid grid-cols-[1.5fr_0.55fr_0.8fr] gap-3 border-b border-slate-100 py-2 text-sm text-slate-700">
                  <span>{item.description}</span>
                  <span>{item.quantity}</span>
                  <span className="text-right">{formatEGP(Number(item.subtotal ?? 0))}</span>
                </div>
              ))}

              {labor.map((item) => (
                <div key={item.description} className="grid grid-cols-[1.5fr_0.55fr_0.8fr] gap-3 border-b border-slate-100 py-2 text-sm text-slate-700">
                  <span>{item.description}</span>
                  <span>{item.quantity}</span>
                  <span className="text-right">{formatEGP(Number(item.subtotal ?? 0))}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Staff</h3>
            <dl className="space-y-3 text-sm text-slate-600">
              <div className="flex justify-between gap-3"><dt>Advisor</dt><dd className="font-medium text-slate-900">{job.advisorId?.name ?? 'Unassigned'}</dd></div>
              <div className="flex justify-between gap-3"><dt>Technician</dt><dd className="font-medium text-slate-900">{job.technicianId?.name ?? 'Unassigned'}</dd></div>
              <div className="flex justify-between gap-3"><dt>Created</dt><dd className="font-medium text-slate-900">{job.createdAt?.slice(0, 10) ?? '—'}</dd></div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Totals</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex justify-between"><span>Parts</span><span>{formatEGP(Number(job.totals?.totalParts ?? 0))}</span></div>
              <div className="flex justify-between"><span>Labor</span><span>{formatEGP(laborTotal)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatEGP(Number(job.totals?.tax ?? 0))}</span></div>
              <div className="mt-3 border-t border-slate-200 pt-3 flex justify-between text-base font-bold text-slate-900">
                <span>Total</span>
                <span>{formatEGP(totalEstimate)}</span>
              </div>
            </div>

            <Link
              to="/invoice"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              View invoice
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InvoicePage({ user: _user }: { user: AuthUser }) {
  const { data: invoices = [], isLoading } = useQuery<InvoiceRecord[]>({ queryKey: ['invoices'], queryFn: getInvoices });
  const invoice = invoices[0];

  if (isLoading) {
    return <div className="mx-auto max-w-6xl p-6 text-sm text-slate-500">Loading invoices...</div>;
  }

  if (!invoice) {
    return <div className="mx-auto max-w-6xl p-6"><div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No invoices have been created yet.</div></div>;
  }

  const invoiceJob = invoice.jobCardId;
  const paid = invoice.amountPaid ?? (invoice.payments ?? []).reduce((sum, payment) => sum + payment.amount, 0);
  const total = invoiceJob?.totals?.grandTotal ?? 0;
  const balance = Math.max(0, total - paid);
  const subtotal = (invoiceJob?.totals?.totalParts ?? 0) + (invoiceJob?.totals?.totalLabor ?? 0);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-600">Billing</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Invoice {invoice.invoiceNumber}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {invoice.status}
          </span>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Record payment</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Customer</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{invoiceJob?.customerId?.fullName ?? 'Unknown customer'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">Issued</p>
              <p className="mt-2 text-base font-medium text-slate-900">{invoice.createdAt?.slice(0, 10) ?? '—'}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Vehicle</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{invoiceJob?.vehicleId ? `${invoiceJob.vehicleId.make} ${invoiceJob.vehicleId.model} • ${formatPlateNumber(invoiceJob.vehicleId.plateNumber)}` : 'Unknown vehicle'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Balance due</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatEGP(balance)}</p>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Payment activity</h2>
            <div className="space-y-3">
              {(invoice.payments ?? []).map((payment) => (
                <div key={`${payment.method}-${payment.date}-${payment.amount}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span>{payment.method}</span>
                  <span>{payment.date}</span>
                  <span className="font-semibold text-slate-900">{formatEGP(payment.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Summary</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatEGP(subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatEGP(Number(invoiceJob?.totals?.tax ?? 0))}</span></div>
              <div className="flex justify-between"><span>Paid</span><span>{formatEGP(paid)}</span></div>
              <div className="mt-3 border-t border-slate-200 pt-3 flex justify-between text-base font-bold text-slate-900">
                <span>Total</span>
                <span>{formatEGP(total)}</span>
              </div>
              <div className="mt-2 flex justify-between text-emerald-700">
                <span>Balance</span>
                <span>{formatEGP(balance)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Payment methods</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="rounded-xl bg-slate-50 px-3 py-2">Card terminal</div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">Cash</div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">Bank transfer</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CustomerPage({ user: _user }: { user: AuthUser }) {
  const queryClient = useQueryClient();
  const { data: customers = [], isLoading } = useQuery<CustomerRecord[]>({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });
  const { data: vehicles = [] } = useQuery<VehicleRecord[]>({
    queryKey: ['vehicles'],
    queryFn: () => getVehicles(),
  });
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    addVehicle: false,
    vin: '',
    plateNumber: '',
    make: '',
    model: '',
    year: '',
    engine: '',
    currentOdometer: '0',
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        address: form.address,
      };

      if (editingId) {
        return updateCustomer(editingId, payload);
      }

      const customer = await createCustomer(payload);
      if (form.addVehicle && customer._id) {
        await createVehicle({
          customerId: customer._id,
          vin: form.vin,
          plateNumber: form.plateNumber,
          make: form.make,
          model: form.model,
          year: Number(form.year),
          engine: form.engine,
          currentOdometer: Number(form.currentOdometer),
        });
      }
      return customer;
    },
    onSuccess: () => {
      setFormOpen(false);
      setEditingId(null);
      setForm({ fullName: '', phone: '', email: '', address: '', addVehicle: false, vin: '', plateNumber: '', make: '', model: '', year: '', engine: '', currentOdometer: '0' });
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  const customerRows = customers.map((customer) => ({
    id: customer._id ?? '',
    name: customer.fullName ?? 'Unnamed customer',
    phone: customer.phone ?? '—',
    vehicles: vehicles.filter((vehicle) => vehicle.customerId?._id === customer._id).length,
    lastVisit: '—',
    lifetime: '—',
  }));

  useEffect(() => {
    if (!selectedCustomer && customerRows.length) {
      setSelectedCustomer(customerRows[0].name);
      return;
    }

    if (customerRows.length && !customerRows.some((row) => row.name === selectedCustomer)) {
      setSelectedCustomer(customerRows[0].name);
    }
  }, [customerRows, selectedCustomer]);

  const selectedCustomerRow = customerRows.find((row) => row.name === selectedCustomer) ?? customerRows[0];
  const selectedCustomerRecord = customers.find((entry) => entry._id === selectedCustomerRow?.id);
  const selectedCustomerVehicles = vehicles.filter((vehicle) => vehicle.customerId?._id === selectedCustomerRecord?._id);

  const openCreateForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm({ fullName: '', phone: '', email: '', address: '', addVehicle: false, vin: '', plateNumber: '', make: '', model: '', year: '', engine: '', currentOdometer: '0' });
    requestAnimationFrame(() => setFormOpen(true));
  };

  const openEditForm = (customerRecord: CustomerRecord) => {
    setFormOpen(false);
    setEditingId(customerRecord._id ?? null);
    setForm({
      fullName: customerRecord.fullName ?? '',
      phone: customerRecord.phone ?? '',
      email: customerRecord.email ?? '',
      address: customerRecord.address ?? '',
      addVehicle: false,
      vin: '',
      plateNumber: '',
      make: '',
      model: '',
      year: '',
      engine: '',
      currentOdometer: '0',
    });
    requestAnimationFrame(() => setFormOpen(true));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await upsertMutation.mutateAsync();
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-600">CRM</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Customers</h1>
        </div>
        <button onClick={openCreateForm} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">Add customer</button>
      </div>

      {formOpen ? (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{editingId ? 'Edit customer' : 'New customer'}</h2>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setFormOpen(false)} className="text-sm text-slate-500">Close</button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.fullName} onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))} placeholder="Full name" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} placeholder="Phone" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} placeholder="Email" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} placeholder="Address" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
          </div>
          {!editingId ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.addVehicle} onChange={(e) => setForm((current) => ({ ...current, addVehicle: e.target.checked }))} />
                Add a vehicle for this customer
              </label>
              {form.addVehicle ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input required value={form.vin} onChange={(e) => setForm((current) => ({ ...current, vin: e.target.value }))} placeholder="VIN" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5" />
                  <input required value={form.plateNumber} onChange={(e) => setForm((current) => ({ ...current, plateNumber: e.target.value }))} placeholder="e.g. 567 أ ب ه" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5" />
                  <input required value={form.make} onChange={(e) => setForm((current) => ({ ...current, make: e.target.value }))} placeholder="Make" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5" />
                  <input required value={form.model} onChange={(e) => setForm((current) => ({ ...current, model: e.target.value }))} placeholder="Model" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5" />
                  <input required value={form.year} onChange={(e) => setForm((current) => ({ ...current, year: e.target.value }))} placeholder="Year" type="number" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5" />
                  <input value={form.engine} onChange={(e) => setForm((current) => ({ ...current, engine: e.target.value }))} placeholder="Engine (optional)" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5" />
                  <input value={form.currentOdometer} onChange={(e) => setForm((current) => ({ ...current, currentOdometer: e.target.value }))} placeholder="Current odometer" type="number" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5" />
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
            <button type="submit" disabled={upsertMutation.isPending} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {upsertMutation.isPending ? 'Saving...' : editingId ? 'Update customer' : 'Create customer'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.7fr_1fr_0.8fr_0.9fr_0.9fr_0.7fr] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Customer</span>
            <span>Phone</span>
            <span>Vehicles</span>
            <span>Last visit</span>
            <span>Lifetime</span>
            <span>Actions</span>
          </div>

          {customerRows.map((customerEntry) => (
            <div key={customerEntry.id || customerEntry.phone} className={`grid w-full grid-cols-[1.7fr_1fr_0.8fr_0.9fr_0.9fr_0.7fr] gap-3 border-b border-slate-200 px-5 py-4 text-left text-sm text-slate-700 transition last:border-b-0 hover:bg-slate-50 ${selectedCustomer === customerEntry.name ? 'bg-slate-50' : 'bg-white'}`}>
              <button type="button" onClick={() => setSelectedCustomer(customerEntry.name)} className="text-left">
                <div>
                  <p className="font-semibold text-slate-900">{customerEntry.name}</p>
                  <p className="text-xs text-slate-500">{customerEntry.vehicles} connected vehicle{customerEntry.vehicles === 1 ? '' : 's'}</p>
                </div>
              </button>
              <span>{customerEntry.phone}</span>
              <span>{customerEntry.vehicles}</span>
              <span>{customerEntry.lastVisit}</span>
              <span className="font-medium text-slate-900">{customerEntry.lifetime}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { const found = customers.find((entry) => entry._id === customerEntry.id); if (found) openEditForm(found); }} className="text-xs font-medium text-sky-700">Edit</button>
                {customerEntry.id ? <button type="button" onClick={() => deleteMutation.mutate(customerEntry.id)} className="text-xs font-medium text-rose-700">Delete</button> : null}
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Profile</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">{selectedCustomerRow?.name ?? 'No customer selected'}</h2>
            </div>
          </div>

          <dl className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between"><dt>Email</dt><dd className="font-medium text-slate-900">{selectedCustomerRecord?.email || '—'}</dd></div>
            <div className="flex justify-between"><dt>Address</dt><dd className="max-w-[12rem] text-right font-medium text-slate-900">{selectedCustomerRecord?.address || '—'}</dd></div>
            <div className="flex justify-between"><dt>Connected vehicles</dt><dd className="font-medium text-slate-900">{selectedCustomerVehicles.length}</dd></div>
          </dl>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Connected vehicles</h3>
            {selectedCustomerVehicles.length ? (
              <div className="space-y-2">
                {selectedCustomerVehicles.map((vehicle) => (
                  <div key={vehicle._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{vehicle.make} {vehicle.model}</p>
                      <p className="text-slate-500">{formatPlateNumber(vehicle.plateNumber)} · {vehicle.year}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-500">{vehicle.vin}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">No vehicle connected yet.</p>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{isLoading ? 'Loading history...' : 'Service history'}</h3>
            <div className="space-y-3">
              <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">Service history is not available for this customer yet.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TeamPage({ user }: { user: AuthUser }) {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery<UserRecord[]>({ queryKey: ['users'], queryFn: getUsers });
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'advisor' as Role });

  const saveMutation = useMutation({
    mutationFn: () => editingId ? updateUser(editingId, { ...form, ...(form.password ? { password: form.password } : {}) }) : createUser(form),
    onSuccess: () => {
      setFormOpen(false);
      setEditingId(null);
      setForm({ name: '', email: '', password: '', role: 'advisor' });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveMutation.mutateAsync();
  };

  const openCreateForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm({ name: '', email: '', password: '', role: 'advisor' });
    requestAnimationFrame(() => setFormOpen(true));
  };

  const openEditForm = (teamMember: UserRecord) => {
    setFormOpen(false);
    setEditingId(teamMember.id);
    setForm({ name: teamMember.name, email: teamMember.email, password: '', role: teamMember.role });
    requestAnimationFrame(() => setFormOpen(true));
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-600">Administration</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Team access</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">Create staff accounts and give each person the access they need for the workshop floor.</p>
        </div>
        <button onClick={() => formOpen ? setFormOpen(false) : openCreateForm()} className="soft-button rounded-xl px-4 py-2.5 text-sm font-medium text-white">
          {formOpen ? 'Close form' : 'Add team member'}
        </button>
      </div>

      {formOpen ? (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit staff account' : 'New staff account'}</h2>
              <p className="text-sm text-slate-500">{editingId ? 'Update access details or leave the password blank to keep it.' : 'The account can sign in immediately after creation.'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <button type="button" onClick={() => setFormOpen(false)} className="text-sm text-slate-500">Close</button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Work email" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input required={!editingId} minLength={8} type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder={editingId ? 'New password (optional)' : 'Temporary password'} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5">
              <option value="advisor">Advisor</option>
              <option value="technician">Technician</option>
              <option value="cashier">Cashier</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          {saveMutation.isError ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{saveMutation.error instanceof Error ? saveMutation.error.message : 'Unable to save account'}</p> : null}
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={saveMutation.isPending} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{saveMutation.isPending ? 'Saving...' : editingId ? 'Save changes' : 'Create account'}</button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {users.map((teamMember) => (
          <div key={teamMember.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">{teamMember.name.charAt(0).toUpperCase()}</div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${teamMember.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {teamMember.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h2 className="font-semibold text-slate-900">{teamMember.name}</h2>
            <p className="mt-1 truncate text-sm text-slate-500">{teamMember.email}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-sky-700">{teamMember.role}</p>
            <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => openEditForm(teamMember)} className="text-xs font-medium text-sky-700">Edit</button>
              {teamMember.id !== user.id ? <button type="button" onClick={() => { if (window.confirm(`Delete ${teamMember.name}'s account?`)) deleteMutation.mutate(teamMember.id); }} className="text-xs font-medium text-rose-700">Delete</button> : <span className="text-xs text-slate-400">Current account</span>}
            </div>
          </div>
        ))}
      </div>
      {!isLoading && users.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No team members found.</div> : null}
    </div>
  );
}

function VehiclePage({ user: _user }: { user: AuthUser }) {
  const queryClient = useQueryClient();
  const { data: customers = [] } = useQuery<CustomerRecord[]>({ queryKey: ['customers'], queryFn: getCustomers });
  const { data: vehicles = [], isLoading } = useQuery<VehicleRecord[]>({
    queryKey: ['vehicles'],
    queryFn: () => getVehicles(),
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ customerId: '', vin: '', plateNumber: '', make: '', model: '', year: '', engine: '', currentOdometer: '0' });
  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customerId: form.customerId || customers[0]?._id || '',
        vin: form.vin,
        plateNumber: form.plateNumber,
        make: form.make,
        model: form.model,
        year: Number(form.year),
        engine: form.engine,
        currentOdometer: Number(form.currentOdometer),
      };

      if (editingId) {
        return updateVehicle(editingId, payload);
      }
      return createVehicle(payload);
    },
    onSuccess: () => {
      setFormOpen(false);
      setEditingId(null);
      setForm({ customerId: '', vin: '', plateNumber: '', make: '', model: '', year: '', engine: '', currentOdometer: '0' });
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  });

  const vehicleRows = vehicles.map((vehicle) => ({
    id: vehicle._id ?? '',
    plate: vehicle.plateNumber ?? 'N/A',
    make: vehicle.make ?? 'Unknown',
    model: vehicle.model ?? 'Unknown',
    year: vehicle.year ?? 0,
    owner: vehicle.customerId?.fullName ?? 'Unknown owner',
    lastService: '—',
    status: 'Active',
  }));

  useEffect(() => {
    if (!selectedVehicleId && vehicleRows.length) {
      setSelectedVehicleId(vehicleRows[0].id);
      return;
    }

    if (vehicleRows.length && !vehicleRows.some((row) => row.id === selectedVehicleId)) {
      setSelectedVehicleId(vehicleRows[0].id);
    }
  }, [vehicleRows, selectedVehicleId]);

  const selectedVehicleRow = vehicleRows.find((row) => row.id === selectedVehicleId) ?? vehicleRows[0];
  const liveVehicle = vehicles.find((vehicle) => vehicle._id === selectedVehicleRow?.id) ?? null;
  const selectedVehiclePlate = formatPlateNumber(liveVehicle?.plateNumber ?? selectedVehicleRow?.plate ?? '');

  const openCreateForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm({ customerId: customers[0]?._id ?? '', vin: '', plateNumber: '', make: '', model: '', year: '', engine: '', currentOdometer: '0' });
    requestAnimationFrame(() => setFormOpen(true));
  };

  const openEditForm = (vehicleRecord: VehicleRecord) => {
    setFormOpen(false);
    setEditingId(vehicleRecord._id ?? null);
    setForm({
      customerId: vehicleRecord.customerId?._id ?? customers[0]?._id ?? '',
      vin: vehicleRecord.vin ?? '',
      plateNumber: vehicleRecord.plateNumber ?? '',
      make: vehicleRecord.make ?? '',
      model: vehicleRecord.model ?? '',
      year: vehicleRecord.year ? String(vehicleRecord.year) : '',
      engine: vehicleRecord.engine ?? '',
      currentOdometer: String(vehicleRecord.currentOdometer ?? 0),
    });
    requestAnimationFrame(() => setFormOpen(true));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await upsertMutation.mutateAsync();
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-600">Fleet</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Vehicles</h1>
        </div>
        <button onClick={openCreateForm} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">Add vehicle</button>
      </div>

      {formOpen ? (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{editingId ? 'Edit vehicle' : 'New vehicle'}</h2>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setFormOpen(false)} className="text-sm text-slate-500">Close</button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select value={form.customerId} onChange={(e) => setForm((current) => ({ ...current, customerId: e.target.value }))} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5">
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>{customer.fullName}</option>
              ))}
            </select>
            <input value={form.vin} onChange={(e) => setForm((current) => ({ ...current, vin: e.target.value }))} placeholder="VIN" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.plateNumber} onChange={(e) => setForm((current) => ({ ...current, plateNumber: e.target.value }))} placeholder="e.g. 567 أ ب ه" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.make} onChange={(e) => setForm((current) => ({ ...current, make: e.target.value }))} placeholder="Make" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.model} onChange={(e) => setForm((current) => ({ ...current, model: e.target.value }))} placeholder="Model" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.year} onChange={(e) => setForm((current) => ({ ...current, year: e.target.value }))} placeholder="Year" type="number" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.engine} onChange={(e) => setForm((current) => ({ ...current, engine: e.target.value }))} placeholder="Engine" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
            <input value={form.currentOdometer} onChange={(e) => setForm((current) => ({ ...current, currentOdometer: e.target.value }))} placeholder="Current odometer" type="number" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
            <button type="submit" disabled={upsertMutation.isPending} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {upsertMutation.isPending ? 'Saving...' : editingId ? 'Update vehicle' : 'Create vehicle'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="grid gap-6 md:grid-cols-2">
          {vehicleRows.map((vehicle) => (
            <div key={vehicle.id || vehicle.plate} className={`rounded-2xl border p-5 text-left shadow-sm transition ${selectedVehicleId === vehicle.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
              <div className="mb-4 flex items-center justify-between">
                <button type="button" onClick={() => setSelectedVehicleId(vehicle.id)} className="text-left">
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${selectedVehicleId === vehicle.id ? 'text-slate-300' : 'text-slate-500'}`}>Plate</p>
                    <p className="mt-1 text-xl font-semibold">{formatPlateNumber(vehicle.plate)}</p>
                  </div>
                </button>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${selectedVehicleId === vehicle.id ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700'}`}>
                  {vehicle.status}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className={selectedVehicleId === vehicle.id ? 'text-slate-300' : 'text-slate-700'}>Vehicle</span><span className="font-medium">{vehicle.make} {vehicle.model} ({vehicle.year})</span></div>
                <div className="flex justify-between"><span className={selectedVehicleId === vehicle.id ? 'text-slate-300' : 'text-slate-700'}>Owner</span><span className="font-medium">{vehicle.owner}</span></div>
                <div className="flex justify-between"><span className={selectedVehicleId === vehicle.id ? 'text-slate-300' : 'text-slate-700'}>Last service</span><span className="font-medium">{vehicle.lastService}</span></div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { const record = vehicles.find((entry) => entry._id === vehicle.id); if (record) openEditForm(record); }} className="text-xs font-medium text-sky-700">Edit</button>
                  {vehicle.id ? <button type="button" onClick={() => deleteMutation.mutate(vehicle.id)} className="text-xs font-medium text-rose-700">Delete</button> : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Active vehicle</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{selectedVehiclePlate || 'No vehicle selected'}</h2>
          </div>

          <dl className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between"><dt>VIN</dt><dd className="font-medium text-slate-900">{liveVehicle?.vin ?? '—'}</dd></div>
            <div className="flex justify-between"><dt>Odometer</dt><dd className="font-medium text-slate-900">{liveVehicle?.currentOdometer?.toLocaleString() ?? '—'}</dd></div>
            <div className="flex justify-between"><dt>Engine</dt><dd className="font-medium text-slate-900">{liveVehicle?.engine || '—'}</dd></div>
          </dl>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{isLoading ? 'Loading notes...' : 'Service notes'}</p>
            <p className="mt-2 text-sm text-slate-700">No service notes have been recorded for this vehicle.</p>
          </div>

          <div className="mt-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Appointments</h3>
            <div className="space-y-2">
              <div className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">No appointments have been recorded.</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AppShell({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const location = useLocation();
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { to: '/customers', label: 'Customers', icon: ClipboardList, key: 'customers' },
    { to: '/vehicles', label: 'Vehicles', icon: CarFront, key: 'vehicles' },
    { to: '/intake', label: 'Intake', icon: ClipboardPenLine, key: 'intake' },
    { to: '/jobs', label: 'Jobs', icon: Wrench, key: 'jobs' },
    { to: '/invoice', label: 'Invoice', icon: DollarSign, key: 'invoice' },
    { to: '/inventory', label: 'Inventory', icon: Boxes, key: 'inventory' },
    { to: '/team', label: 'Team', icon: Users, key: 'users' },
  ].filter((item) => canAccess(user.role, item.key));

  return (
    <div className="app-shell min-h-screen text-slate-900">
      <header className="glass-panel border-b border-slate-200/80 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-900 p-2 text-white">
              <CarFront className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-amber-600">Cairo Auto Service</p>
              <h1 className="text-base font-bold">Egypt Fleet Control</h1>
            </div>
          </div>

          <nav className="nav-bar flex max-w-full flex-nowrap gap-1.5 pb-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                    `nav-pill flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-2.5 py-2 text-sm font-medium transition ${
                    isActive ? 'nav-pill active border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Signed in</p>
              <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">{user.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="soft-button inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div key={location.pathname} className="route-shell">
        <Routes>
          <Route path="/" element={<DashboardScreen user={user} />} />
          <Route path="/customers" element={<CustomerPage user={user} />} />
          <Route path="/vehicles" element={<VehiclePage user={user} />} />
          <Route path="/intake" element={<IntakePage user={user} />} />
          <Route path="/jobs" element={<JobDetailPage user={user} />} />
          <Route path="/invoice" element={<InvoicePage user={user} />} />
          <Route path="/inventory" element={<InventoryPage user={user} />} />
          <Route path="/team" element={<TeamPage user={user} />} />
        </Routes>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await onLogin(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-stage flex min-h-screen items-center justify-center px-4 py-8">
      <div className="login-frame grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="login-story relative flex min-h-[280px] flex-col justify-between overflow-hidden p-8 text-white sm:p-12">
          <div className="relative z-10 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-400 p-3 text-slate-950"><CarFront className="h-6 w-6" /></div>
            <div><p className="text-[10px] uppercase tracking-[0.28em] text-amber-300">Cairo Auto Service</p><p className="font-semibold">Egypt Fleet Control</p></div>
          </div>
          <div className="relative z-10 mt-16">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">The workshop, in rhythm</p>
            <h1 className="max-w-md text-4xl font-bold leading-tight sm:text-5xl">Keep every car moving forward.</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">A calm command center for intake, service, parts, payments, and the people who make it all happen.</p>
          </div>
          <div className="relative z-10 mt-12 flex flex-wrap gap-2 text-xs text-slate-300"><span className="rounded-full border border-white/20 px-3 py-1.5">Live workshop board</span><span className="rounded-full border border-white/20 px-3 py-1.5">12 branches</span></div>
        </div>

        <div className="p-8 sm:p-12">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">Staff entrance</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Welcome back.</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in and pick up where the shop left off.</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
              placeholder="name@domain.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
              placeholder="••••••••"
            />
          </div>

          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="soft-button w-full rounded-xl px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [booting, setBooting] = useState(true);

  const syncUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setBooting(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const loggedInUser = await loginUser(email, password);
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    void syncUser();
  }, []);

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">
        Checking session...
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />} />
          <Route path="/*" element={user ? <AppShell user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
