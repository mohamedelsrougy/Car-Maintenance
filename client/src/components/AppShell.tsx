import { Boxes, CarFront, ClipboardList, ClipboardPenLine, DollarSign, LayoutDashboard, LogOut, Users, Wrench } from 'lucide-react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { canAccess } from '../config/navigation';
import { DashboardPage } from '../pages/DashboardPage';
import { CustomerPage } from '../pages/CustomerPage';
import { IntakePage } from '../pages/IntakePage';
import { InventoryPage } from '../pages/InventoryPage';
import { InvoicePage } from '../pages/InvoicePage';
import { JobDetailPage } from '../pages/JobDetailPage';
import { TeamPage } from '../pages/TeamPage';
import { VehiclePage } from '../pages/VehiclePage';
import type { AuthUser } from '../types';

export function AppShell({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
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
          <Route path="/" element={<DashboardPage user={user} />} />
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
