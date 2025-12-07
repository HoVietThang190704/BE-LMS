import { IUserRepository } from '../../repositories/IUserRepository';
import { UserEntity, UserProfileEntity } from '../../entities/User.entity';

export interface UpdateProfileInput {
  userId: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

/**
 * Update User Profile Use Case
 * Business logic for updating user profile
 */
export class UpdateUserProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: UpdateProfileInput): Promise<UserEntity> {
    // 1. Validate input
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    // 2. Check if user exists
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 3. Validate phone uniqueness if provided and different from current
    if (input.phone && input.phone !== user.profile?.phone) {
      const phoneExists = await this.userRepository.phoneExists(input.phone);
      if (phoneExists) {
        throw new Error('Phone number already in use');
      }

      // Validate phone format
      const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8}$/;
      if (!phoneRegex.test(input.phone)) {
        throw new Error('Invalid phone number format');
      }
    }

    // 4. Validate full name if provided
    if (input.fullName !== undefined) {
      const trimmed = input.fullName.trim();
      if (!trimmed) {
        throw new Error('Full name cannot be empty');
      }
      if (trimmed.length > 100) {
        throw new Error('Full name cannot exceed 100 characters');
      }
    }

    if (input.bio !== undefined && input.bio !== null && input.bio.length > 500) {
      throw new Error('Bio cannot exceed 500 characters');
    }

    // 5. Prepare update data
    const updateData: Partial<UserEntity> = {};
    if (input.fullName !== undefined) updateData.fullName = input.fullName.trim();

    const profileUpdates: Partial<UserProfileEntity> = {};
    if (input.phone !== undefined) profileUpdates.phone = input.phone ?? undefined;
    if (input.avatarUrl !== undefined) profileUpdates.avatarUrl = input.avatarUrl ?? undefined;
    if (input.bio !== undefined) profileUpdates.bio = input.bio ?? undefined;

    if (Object.keys(profileUpdates).length > 0) {
      updateData.profile = profileUpdates;
    }

    // 6. Update user
    const updatedUser = await this.userRepository.update(input.userId, updateData);

    if (!updatedUser) {
      throw new Error('Failed to update user profile');
    }

    return updatedUser;
  }
}
