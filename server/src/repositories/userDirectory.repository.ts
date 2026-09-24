import { User } from '../models/User.model.js';
import type { UserRole } from '../types/enums.js';

function normalizeUser(user: any) {
  if (!user) return user;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

export const userDirectoryRepository = {
  async listAll() {
    const users = await User.find({}).select('name email role isActive').sort({ name: 1 });
    return users.map(normalizeUser);
  },

  async listByRole(role?: UserRole) {
    const filter = role ? { role, isActive: true } : { isActive: true };
    const users = await User.find(filter).select('name email role isActive').sort({ name: 1 });
    return users.map(normalizeUser);
  },

  findActiveByIdAndRole(id: string, role: UserRole) {
    return User.findOne({ _id: id, role, isActive: true });
  },
};
