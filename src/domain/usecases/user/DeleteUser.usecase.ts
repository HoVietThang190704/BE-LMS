import { IUserRepository } from '../../repositories/IUserRepository';
import { UserEntity } from '../../entities/User.entity';

type UserRole = UserEntity['role'];

export interface ActorContext {
  id: string;
  role: UserRole;
}

export interface DeleteUserInput {
  userId: string;
  actor?: ActorContext;
}

const ADMIN_ROLE: UserRole = 'admin';

const ERROR_MESSAGES = {
  USER_ID_REQUIRED: 'User ID is required',
  USER_NOT_FOUND: 'User not found',
  SELF_DELETE_FORBIDDEN: 'Không thể tự xóa tài khoản của bạn',
  ADMIN_DELETE_FORBIDDEN: 'Không thể xóa tài khoản của quản trị viên khác',
  DELETE_FAILED: 'Failed to delete user'
} as const;

export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  private withStatusCode(error: Error, statusCode: number) {
    (error as any).statusCode = statusCode;
    return error;
  }

  async execute(input: DeleteUserInput): Promise<void> {
    if (!input.userId) {
      throw this.withStatusCode(new Error(ERROR_MESSAGES.USER_ID_REQUIRED), 400);
    }

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw this.withStatusCode(new Error(ERROR_MESSAGES.USER_NOT_FOUND), 404);
    }

    const actor = input.actor;
    if (actor && actor.id === user.id) {
      throw this.withStatusCode(new Error(ERROR_MESSAGES.SELF_DELETE_FORBIDDEN), 403);
    }

    if (actor?.role === ADMIN_ROLE && user.isAdmin()) {
      throw this.withStatusCode(new Error(ERROR_MESSAGES.ADMIN_DELETE_FORBIDDEN), 403);
    }

    const deleted = await this.userRepository.delete(input.userId);
    if (!deleted) {
      throw this.withStatusCode(new Error(ERROR_MESSAGES.DELETE_FAILED), 500);
    }
  }
}
