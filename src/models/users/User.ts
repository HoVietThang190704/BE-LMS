import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

interface UserAddress {
  province?: string;
  district?: string;
  commune?: string;
  street?: string;
  detail?: string;
}

interface UserProfile {
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  address?: UserAddress;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  fullName?: string;
  role: 'admin' | 'teacher' | 'student';
  profile?: UserProfile;
  isActive: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  lastLoginAt?: Date;
  googleId?: string;
  facebookId?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AddressSchema = new Schema<UserAddress>({
  province: { type: String, trim: true },
  district: { type: String, trim: true },
  commune: { type: String, trim: true },
  street: { type: String, trim: true },
  detail: { type: String, trim: true }
}, { _id: false });

const ProfileSchema = new Schema<UserProfile>({
  avatarUrl: { type: String },
  phone: {
    type: String,
    trim: true,
    match: [
      /^(\+84|84|0)[1-9][0-9]{8}$/,
      'Số điện thoại không hợp lệ'
    ]
  },
  bio: {
    type: String,
    maxlength: [500, 'Giới thiệu không được vượt quá 500 ký tự']
  },
  address: {
    type: AddressSchema,
    default: undefined
  }
}, { _id: false });

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Email không hợp lệ'
    ]
  },
  passwordHash: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },
  fullName: {
    type: String,
    trim: true,
    maxlength: [100, 'Họ tên không được vượt quá 100 ký tự']
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    default: 'student'
  },
  profile: {
    type: ProfileSchema,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date
  },
  googleId: {
    type: String
  },
  facebookId: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'users'
});

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ isBlocked: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'profile.phone': 1 });

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

export const User = mongoose.model<IUser>('User', UserSchema);