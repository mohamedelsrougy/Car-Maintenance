import { User, type UserDocument } from '../models/User.model.js';
import type { UserRole } from '../types/enums.js';

export const userRepository = {
  findByEmailWithSecrets(email: string) {
    return User.findOne({ email }).select('+passwordHash +refreshTokens');
  },

  findByIdWithSecrets(id: string) {
    return User.findById(id).select('+passwordHash +refreshTokens');
  },

  findById(id: string) {
    return User.findById(id);
  },

  count() {
    return User.countDocuments();
  },

  create(data: { name: string; email: string; passwordHash: string; role: UserRole }) {
    return User.create(data);
  },

  async save(user: UserDocument) {
    return user.save();
  },

  async remove(user: UserDocument) {
    await user.deleteOne();
  },
};
