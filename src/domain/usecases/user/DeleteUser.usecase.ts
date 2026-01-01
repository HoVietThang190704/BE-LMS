import { IUserRepository } from '../../repositories/IUserRepository';

export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const deleted = await this.userRepository.delete(userId);
    if (!deleted) {
      throw new Error('Failed to delete user');
    }
  }
}
