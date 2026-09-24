import type { UserRole } from './enums.js';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
