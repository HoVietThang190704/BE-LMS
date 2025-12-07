/**
 * Data Transfer Objects for User endpoints
 */

export interface UpdateProfileRequestDto {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  fullName?: string;
  profile?: {
    avatarUrl?: string;
    phone?: string;
    bio?: string;
  };
  facebookId?: string;
  googleId?: string;
  role: 'admin' | 'teacher' | 'student';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserMapper {
  static toResponseDto(user: any): UserResponseDto {
    const profile = user.profile ? {
      avatarUrl: user.profile.avatarUrl,
      phone: user.profile.phone,
      bio: user.profile.bio
    } : undefined;

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      profile,
      facebookId: user.facebookId || user.facebookID,
      googleId: user.googleId,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
