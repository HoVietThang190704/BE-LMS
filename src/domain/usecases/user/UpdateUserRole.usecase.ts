import { IUserRepository } from '../../repositories/IUserRepository';
import { UserEntity } from '../../entities/User.entity';

export interface UpdateUserRoleInput {
  userId: string;
  role: 'admin' | 'teacher' | 'student';
}

export class UpdateUserRoleUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserRoleInput): Promise<UserEntity> {
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === input.role) {
      return user;
    }

    const updatedUser = await this.userRepository.update(input.userId, {
      role: input.role
    });

    if (!updatedUser) {
      throw new Error('Failed to update user role');
    }

    return updatedUser;
  }
}
