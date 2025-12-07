import { IUserRepository } from '../../repositories/IUserRepository';
import { uploadToCloudinary, deleteFromCloudinary } from '../../../shared/utils/cloudinary';

export class UpdateUserAvatarUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    userId: string,
    file: Express.Multer.File
  ): Promise<{ avatarUrl: string; message: string }> {
    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Upload new avatar to Cloudinary
    const { url: newAvatarUrl, publicId } = await uploadToCloudinary(file, 'avatars');

    // Delete old avatar from Cloudinary if exists
    const oldAvatar = (user.profile && (user.profile as any).avatarUrl) || undefined;
    if (oldAvatar && oldAvatar.includes('cloudinary')) {
      const urlParts = oldAvatar.split('/');
      const publicIdWithExt = urlParts.slice(-2).join('/');
      const oldPublicId = publicIdWithExt.split('.')[0];
      await deleteFromCloudinary(oldPublicId);
    }

    // Update user avatar in database (nested profile.avatarUrl)
    await this.userRepository.update(userId, { profile: { ...(user.profile || {}), avatarUrl: newAvatarUrl } as any });

    return {
      avatarUrl: newAvatarUrl,
      message: 'Cập nhật ảnh đại diện thành công'
    };
  }
}
