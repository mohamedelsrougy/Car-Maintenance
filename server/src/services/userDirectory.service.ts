import { userDirectoryRepository } from '../repositories/userDirectory.repository.js';
import type { UserRole } from '../types/enums.js';

export const userDirectoryService = {
  listAll() {
    return userDirectoryRepository.listAll();
  },

  list(role?: UserRole) {
    return userDirectoryRepository.listByRole(role);
  },
};
