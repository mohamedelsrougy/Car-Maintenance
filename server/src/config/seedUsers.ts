import { User } from '../models/User.model.js';

const DEFAULT_USERS = [
  { name: 'Admin User', email: 'admin@carservice.local', password: 'Password123!', role: 'admin' as const },
  { name: 'Advisor User', email: 'advisor@carservice.local', password: 'Password123!', role: 'advisor' as const },
  { name: 'Technician User', email: 'tech@carservice.local', password: 'Password123!', role: 'technician' as const },
  { name: 'Cashier User', email: 'cashier@carservice.local', password: 'Password123!', role: 'cashier' as const },
];

export async function ensureDemoUsers(): Promise<void> {
  const existingUsers = await User.find({ email: { $in: DEFAULT_USERS.map((user) => user.email) } }).lean();
  const existingEmails = new Set(existingUsers.map((user) => user.email));

  for (const user of DEFAULT_USERS) {
    if (existingEmails.has(user.email)) {
      continue;
    }

    await User.create({
      name: user.name,
      email: user.email,
      passwordHash: user.password,
      role: user.role,
      isActive: true,
    });
  }
}
