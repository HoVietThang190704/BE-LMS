import { IUserRepository } from '../../repositories/IUserRepository';
import { UserEntity } from '../../entities/User.entity';

export interface UpdateUserBlockStatusInput {
  userId: string;
  isBlocked: boolean;
}

export class UpdateUserBlockStatusUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserBlockStatusInput): Promise<UserEntity> {
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isBlocked === input.isBlocked) {
      return user;
    }

    const updatedUser = await this.userRepository.update(input.userId, {
      isBlocked: input.isBlocked
    });

    if (!updatedUser) {
      throw new Error('Failed to update user block status');
    }

    return updatedUser;
  }
}
