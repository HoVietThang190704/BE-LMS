import { Request, Response } from 'express';
import { GetUsersUseCase } from '../../domain/usecases/user/GetUsers.usecase';
import { UpdateUserBlockStatusUseCase } from '../../domain/usecases/user/UpdateUserBlockStatus.usecase';
import { CreateUserByAdminUseCase } from '../../domain/usecases/user/CreateUserByAdmin.usecase';
import { UpdateUserRoleUseCase } from '../../domain/usecases/user/UpdateUserRole.usecase';
import { DeleteUserUseCase } from '../../domain/usecases/user/DeleteUser.usecase';
import { UserMapper } from '../dto/user/User.dto';
import { sendSuccess, handleControllerError, sendFailure } from '../../shared/utils/controllerUtils';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';
import type { UserEntity } from '../../domain/entities/User.entity';

type UserRole = UserEntity['role'];

export class AdminUserController {
  constructor(
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly updateUserBlockStatusUseCase: UpdateUserBlockStatusUseCase,
    private readonly createUserByAdminUseCase: CreateUserByAdminUseCase,
    private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase
  ) {}

  private buildActorContext(req: Request): { id: string; role: UserRole } | undefined {
    if (!req.user) {
      return undefined;
    }

    return {
      id: req.user.userId,
      role: req.user.role as UserRole
    };
  }

  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const roles = req.query.role && Array.isArray(req.query.role)
        ? (req.query.role as string[])
        : (req.query.roles as string[] | undefined);

      // support role (single) and role[]
      const roleSingle = typeof req.query.role === 'string' ? req.query.role : undefined;

      const isVerified = req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined;
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
      const createdFrom = req.query.createdFrom as string | undefined;
      const createdTo = req.query.createdTo as string | undefined;

      const result = await this.getUsersUseCase.execute({
        page,
        limit,
        roles: roles || undefined,
        role: roleSingle,
        isVerified,
        search,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        createdFrom,
        createdTo
      });

      const data = result.users.map(u => UserMapper.toResponseDto(u));

      sendSuccess(res, {
        message: 'Lấy danh sách người dùng thành công',
        data: {
          users: data,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: Math.ceil((result.total || 0) / result.limit)
          }
        }
      });
    } catch (error: any) {
      handleControllerError(res, error, 'Lỗi server khi lấy danh sách người dùng');
    }
  }

  async updateBlockStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const { isBlocked } = req.body;

      const updatedUser = await this.updateUserBlockStatusUseCase.execute({
        userId,
        isBlocked
      });

      sendSuccess(res, {
        message: isBlocked ? 'Khóa tài khoản thành công' : 'Mở khóa tài khoản thành công',
        data: UserMapper.toResponseDto(updatedUser)
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        sendFailure(res, {
          status: HTTP_STATUS.NOT_FOUND,
          message: 'Không tìm thấy người dùng'
        });
        return;
      }

      handleControllerError(res, error, 'Lỗi server khi cập nhật trạng thái khóa tài khoản');
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const user = await this.createUserByAdminUseCase.execute({
        email: payload.email,
        password: payload.password,
        fullName: payload.fullName,
        role: payload.role,
        phone: payload.phone,
        bio: payload.bio
      });

      sendSuccess(res, {
        status: HTTP_STATUS.CREATED,
        message: 'Tạo người dùng thành công',
        data: UserMapper.toResponseDto(user)
      });
    } catch (error: any) {
      if (typeof error?.statusCode === 'number') {
        sendFailure(res, {
          status: error.statusCode,
          message: error.message || 'Không thể tạo người dùng'
        });
        return;
      }

      handleControllerError(res, error, 'Lỗi server khi tạo người dùng');
    }
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const { role } = req.body;

      const updatedUser = await this.updateUserRoleUseCase.execute({
        userId,
        role,
        actor: this.buildActorContext(req)
      });

      sendSuccess(res, {
        message: 'Cập nhật vai trò thành công',
        data: UserMapper.toResponseDto(updatedUser)
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        sendFailure(res, {
          status: HTTP_STATUS.NOT_FOUND,
          message: 'Không tìm thấy người dùng'
        });
        return;
      }

      handleControllerError(res, error, 'Lỗi server khi cập nhật vai trò người dùng');
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      await this.deleteUserUseCase.execute({
        userId,
        actor: this.buildActorContext(req)
      });

      sendSuccess(res, {
        message: 'Xóa người dùng thành công'
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        sendFailure(res, {
          status: HTTP_STATUS.NOT_FOUND,
          message: 'Không tìm thấy người dùng'
        });
        return;
      }

      handleControllerError(res, error, 'Lỗi server khi xóa người dùng');
    }
  }
}
