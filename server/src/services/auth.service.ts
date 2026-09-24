import { StatusCodes } from 'http-status-codes';
import type { UserDocument } from '../models/User.model.js';
import { userRepository } from '../repositories/user.repository.js';
import type { UserRole } from '../types/enums.js';
import { ApiError } from '../utils/ApiError.js';
import { hashToken, refreshTokenExpiryDate, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

function publicUser(user: { _id: unknown; name: string; email: string; role: UserRole; isActive: boolean }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

function issueTokens(user: UserDocument) {
  const accessToken = signAccessToken({
    sub: String(user._id),
    email: user.email,
    role: user.role,
    name: user.name,
  });
  const refreshToken = signRefreshToken(String(user._id));

  const nextTokens = [
    ...(user.refreshTokens ?? []).filter((entry) => entry.expiresAt.getTime() > Date.now()),
    {
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiryDate(),
      createdAt: new Date(),
    },
  ].slice(-5);

  user.set('refreshTokens', nextTokens);

  return { accessToken, refreshToken };
}

export const authService = {
  async createUser(input: { name: string; email: string; password: string; role: UserRole }) {
    const existing = await userRepository.findByEmailWithSecrets(input.email);
    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered');
    }

    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash: input.password,
      role: input.role,
    });

    return publicUser(user);
  },

  async updateUser(id: string, input: Partial<{ name: string; email: string; password: string; role: UserRole }>) {
    const user = await userRepository.findByIdWithSecrets(id);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    if (input.email && input.email !== user.email) {
      const existing = await userRepository.findByEmailWithSecrets(input.email);
      if (existing) {
        throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered');
      }
    }

    const { password, ...profile } = input;
    user.set({ ...profile, ...(password ? { passwordHash: password } : {}) });
    await userRepository.save(user);
    return publicUser(user);
  },

  async deleteUser(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot delete your own account');
    }

    const user = await userRepository.findByIdWithSecrets(id);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    await userRepository.remove(user);
  },

  async register(input: { name: string; email: string; password: string; role: UserRole }) {
    const userCount = await userRepository.count();
    if (userCount === 0 && input.role !== 'admin') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'The first account must be an admin');
    }

    const existing = await userRepository.findByEmailWithSecrets(input.email);
    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered');
    }

    const user = await userRepository.create({ name: input.name, email: input.email, passwordHash: input.password, role: input.role });

    const { accessToken, refreshToken } = issueTokens(user);
    await userRepository.save(user);

    return { user: publicUser(user), accessToken, refreshToken };
  },

  async login(input: { email: string; password: string }) {
    const user = await userRepository.findByEmailWithSecrets(input.email);
    if (!user || !user.isActive) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
    }

    const matches = await user.comparePassword(input.password);
    if (!matches) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
    }

    const { accessToken, refreshToken } = issueTokens(user);
    await userRepository.save(user);

    return { user: publicUser(user), accessToken, refreshToken };
  },

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token missing');
    }

    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }

    const user = await userRepository.findByIdWithSecrets(payload.sub);
    if (!user || !user.isActive) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }

    const incomingHash = hashToken(refreshToken);
    const remaining = (user.refreshTokens ?? []).filter(
      (entry) => entry.tokenHash !== incomingHash && entry.expiresAt.getTime() > Date.now(),
    );

    if (remaining.length === (user.refreshTokens ?? []).length) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token revoked');
    }

    user.set('refreshTokens', remaining);
    const tokens = issueTokens(user);
    await userRepository.save(user);

    return { user: publicUser(user), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  },

  async logout(userId: string, refreshToken: string | undefined) {
    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user) {
      return;
    }

    if (refreshToken) {
      const incomingHash = hashToken(refreshToken);
      user.set(
        'refreshTokens',
        (user.refreshTokens ?? []).filter((entry) => entry.tokenHash !== incomingHash),
      );
    } else {
      user.set('refreshTokens', []);
    }

    await userRepository.save(user);
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    return publicUser(user);
  },
};
