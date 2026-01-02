import { IUserRepository } from '../../repositories/IUserRepository';
import { UserEntity } from '../../entities/User.entity';

type UserRole = UserEntity['role'];

export interface ActorContext {
  id: string;
  role: UserRole;
}

export interface UpdateUserRoleInput {
  userId: string;
  role: UserRole;
  actor?: ActorContext;
}

const ADMIN_ROLE: UserRole = 'admin';

const ERROR_MESSAGES = {
  USER_ID_REQUIRED: 'User ID is required',
  USER_NOT_FOUND: 'User not found',
  SELF_ROLE_CHANGE_FORBIDDEN: 'Không thể tự thay đổi vai trò của bạn',
  ADMIN_ROLE_CHANGE_FORBIDDEN: 'Không thể thay đổi vai trò của quản trị viên khác',
  UPDATE_FAILED: 'Failed to update user role'
} as const;

export class UpdateUserRoleUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  private withStatusCode(error: Error, statusCode: number) {
    (error as any).statusCode = statusCode;
    return error;
  }

  async execute(input: UpdateUserRoleInput): Promise<UserEntity> {
    if (!input.userId) {
      throw this.withStatusCode(new Error(ERROR_MESSAGES.USER_ID_REQUIRED), 400);
    }

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw this.withStatusCode(new Error(ERROR_MESSAGES.USER_NOT_FOUND), 404);
    }

    const actor = input.actor;
    if (actor && actor.id === user.id) {
      throw this.withStatusCode(new Error(ERROR_MESSAGES.SELF_ROLE_CHANGE_FORBIDDEN), 403);
    }

    if (actor?.role === ADMIN_ROLE && user.isAdmin()) {
      throw this.withStatusCode(new Error(ERROR_MESSAGES.ADMIN_ROLE_CHANGE_FORBIDDEN), 403);
    }

    if (user.role === input.role) {
      return user;
    }

    const updatedUser = await this.userRepository.update(input.userId, {
      role: input.role
    });

    if (!updatedUser) {
      throw this.withStatusCode(new Error(ERROR_MESSAGES.UPDATE_FAILED), 500);
    }

    return updatedUser;
  }
}
