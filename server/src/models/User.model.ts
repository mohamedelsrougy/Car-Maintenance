import bcrypt from 'bcryptjs';
import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { USER_ROLES } from '../types/enums.js';

const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      index: true,
    },
    isActive: { type: Boolean, required: true, default: true, index: true },
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('passwordHash')) {
    return;
  }

  const alreadyHashed = this.passwordHash.startsWith('$2a$') || this.passwordHash.startsWith('$2b$');
  if (alreadyHashed) {
    return;
  }

  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = async function comparePassword(
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = mongoose.HydratedDocument<User> & {
  comparePassword(candidate: string): Promise<boolean>;
};
export type UserModel = Model<User, Record<string, never>, { comparePassword(candidate: string): Promise<boolean> }>;

export const User = mongoose.model<User, UserModel>('User', userSchema);
