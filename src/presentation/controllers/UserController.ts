import { Request, Response } from 'express';
import { GetUserProfileUseCase } from '../../domain/usecases/user/GetUserProfile.usecase';
import { UpdateUserProfileUseCase } from '../../domain/usecases/user/UpdateUserProfile.usecase';
import { ResetPasswordUseCase } from '../../domain/usecases/user/ResetPassword.usecase';
import { ChangePasswordUseCase } from '../../domain/usecases/user/ChangePassword.usecase';
import { UpdateUserAvatarUseCase } from '../../domain/usecases/user/UpdateUserAvatar.usecase';
import { UserMapper } from '../dto/user/User.dto';
import { logger } from '../../shared/utils/logger';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';
import { handleControllerError, requireAuth, sendFailure, sendSuccess } from '../../shared/utils/controllerUtils';

/**
 * User Controller
 * Handles HTTP requests for user endpoints
 */
export class UserController {
  constructor(
    private getUserProfileUseCase: GetUserProfileUseCase,
    private updateUserProfileUseCase: UpdateUserProfileUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
    private changePasswordUseCase: ChangePasswordUseCase,
    private updateUserAvatarUseCase: UpdateUserAvatarUseCase
  ) {}

  /**
   * GET /api/users/me/profile
   * Get current user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = requireAuth(req);

      const user = await this.getUserProfileUseCase.execute(userId);
      const userDto = UserMapper.toResponseDto(user);

      sendSuccess(res, {
        message: 'Lấy thông tin profile thành công',
        data: userDto
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        sendFailure(res, {
          status: HTTP_STATUS.NOT_FOUND,
          message: 'Không tìm thấy người dùng'
        });
        return;
      }

      handleControllerError(res, error, 'Lỗi server khi lấy thông tin profile');
    }
  }

  /**
   * PUT /api/users/me/profile
   * Update current user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = requireAuth(req);

      // Accept profile fields
      const { fullName, phone, avatarUrl, bio } = req.body;

      const updatedUser = await this.updateUserProfileUseCase.execute({
        userId,
        fullName,
        phone,
        avatarUrl,
        bio
      });

      const userDto = UserMapper.toResponseDto(updatedUser);

      logger.info(`User profile updated: ${updatedUser.email}`);

      sendSuccess(res, {
        message: 'Cập nhật profile thành công',
        data: userDto
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        sendFailure(res, {
          status: HTTP_STATUS.NOT_FOUND,
          message: 'Không tìm thấy người dùng'
        });
        return;
      }

      if (
        error.message.includes('Phone number already in use') ||
        error.message.includes('Invalid phone number') ||
        error.message.includes('User name') ||
        error.message.includes('age') ||
        error.message.includes('date of birth')
      ) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: error.message
        });
        return;
      }

      handleControllerError(res, error, 'Lỗi server khi cập nhật profile');
    }
  }

  /**
   * POST /auth/reset-password
   * Reset password using token (public endpoint)
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'Token và mật khẩu mới là bắt buộc'
        });
        return;
      }

      await this.resetPasswordUseCase.execute(token, newPassword);

      logger.info('Password reset successfully');

      sendSuccess(res, {
        message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.'
      });
    } catch (error: any) {
      if (
        error.message.includes('Token') ||
        error.message.includes('token') ||
        error.message.includes('hết hạn') ||
        error.message.includes('Mật khẩu')
      ) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: error.message
        });
        return;
      }

      handleControllerError(res, error, 'Lỗi server khi đặt lại mật khẩu');
    }
  }

  /**
   * POST /api/users/me/change-password
   * Change password for authenticated user
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = requireAuth(req);

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'Mật khẩu cũ và mật khẩu mới là bắt buộc'
        });
        return;
      }

      await this.changePasswordUseCase.execute(userId, oldPassword, newPassword);

      logger.info(`Password changed for user: ${userId}`);

      sendSuccess(res, {
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error: any) {
      if (error.message === 'Người dùng không tồn tại') {
        sendFailure(res, {
          status: HTTP_STATUS.NOT_FOUND,
          message: error.message
        });
        return;
      }

      if (
        error.message.includes('Mật khẩu') ||
        error.message.includes('password')
      ) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: error.message
        });
        return;
      }

      handleControllerError(res, error, 'Lỗi server khi đổi mật khẩu');
    }
  }

  /**
   * POST /api/users/me/avatar
   * Upload user avatar
   */
  async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = requireAuth(req);

      // Debug logging
      logger.info('Upload avatar request:', {
        file: req.file,
        body: req.body,
        headers: req.headers['content-type']
      });

      // Check if file was uploaded
      if (!req.file) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'Vui lòng chọn file ảnh để upload'
        });
        return;
      }

      const result = await this.updateUserAvatarUseCase.execute(userId, req.file);

      logger.info(`Avatar updated for user: ${userId}`);

      sendSuccess(res, {
        message: result.message,
        data: {
          avatarUrl: result.avatarUrl
        }
      });
    } catch (error: any) {
      if (error.message === 'Không tìm thấy người dùng') {
        sendFailure(res, {
          status: HTTP_STATUS.NOT_FOUND,
          message: error.message
        });
        return;
      }

      if (error.message.includes('file') || error.message.includes('image')) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: error.message
        });
        return;
      }

      handleControllerError(res, error, 'Lỗi server khi upload ảnh đại diện');
    }
  }
}
