import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../repositories/IUserRepository';
import { UserEntity, UserProfileEntity } from '../../entities/User.entity';

export interface CreateUserByAdminInput {
  email: string;
  password: string;
  fullName?: string;
  role: 'admin' | 'teacher' | 'student';
  phone?: string;
  bio?: string;
}

export class CreateUserByAdminUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  private withStatusCode(error: Error, statusCode: number) {
    (error as any).statusCode = statusCode;
    return error;
  }

  async execute(input: CreateUserByAdminInput): Promise<UserEntity> {
    const email = input.email?.trim().toLowerCase();
    if (!email) {
      throw this.withStatusCode(new Error('Email là bắt buộc'), 400);
    }

    if (!input.password || input.password.length < 6) {
      throw this.withStatusCode(new Error('Mật khẩu phải có ít nhất 6 ký tự'), 400);
    }

    const emailExists = await this.userRepository.emailExists(email);
    if (emailExists) {
      throw this.withStatusCode(new Error('Email đã được sử dụng'), 409);
    }

    if (input.phone) {
      const phoneExists = await this.userRepository.phoneExists(input.phone);
      if (phoneExists) {
        throw this.withStatusCode(new Error('Số điện thoại đã được sử dụng'), 409);
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(input.password, salt);

    const profile: UserProfileEntity = {};
    if (input.phone) profile.phone = input.phone;
    if (input.bio) profile.bio = input.bio;

    const newUser = new UserEntity(
      email,
      hashedPassword,
      input.role,
      true,
      false,
      false,
      undefined,
      input.fullName?.trim(),
      Object.keys(profile).length ? profile : undefined
    );

    return this.userRepository.create(newUser);
  }
}
