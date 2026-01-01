/**
 * User Entity - Pure domain object
 * Contains user business logic, no framework dependencies
 */
export interface UserProfileEntity {
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  address?: {
    province?: string;
    district?: string;
    commune?: string;
    street?: string;
    detail?: string;
  };
}

export interface IUserEntity {
  id?: string;
  email: string;
  fullName?: string;
  passwordHash: string;
  role: 'admin' | 'teacher' | 'student';
  profile?: UserProfileEntity;
  isActive: boolean;
  isVerified?: boolean;
  isBlocked?: boolean;
  lastLoginAt?: Date;
  googleId?: string;
  facebookId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserEntity implements IUserEntity {
  constructor(
    public email: string,
    public passwordHash: string,
    public role: 'admin' | 'teacher' | 'student' = 'student',
    public isActive: boolean = true,
    public isVerified: boolean = false,
    public isBlocked: boolean = false,
    public id?: string,
    public fullName?: string,
    public profile?: UserProfileEntity,
    public lastLoginAt?: Date,
    public googleId?: string,
    public facebookId?: string,
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}

  isStudent(): boolean {
    return this.role === 'student';
  }

  isTeacher(): boolean {
    return this.role === 'teacher';
  }

  isAdmin(): boolean {
    return this.role === 'admin';
  }

  isProfileComplete(): boolean {
    return Boolean(this.fullName && this.profile?.phone && this.profile?.avatarUrl);
  }

  getDisplayName(): string {
    return this.fullName || this.email.split('@')[0];
  }

  toSafeObject(): Omit<IUserEntity, 'passwordHash'> {
    const { passwordHash, ...rest } = this;
    return rest;
  }
}
