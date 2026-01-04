import { z } from "zod";

// Schema for updating user profile
export const updateProfileSchema = z.object({
    body: z.object({
        fullName: z.string()
            .trim()
            .min(1, "Họ tên không được để trống")
            .max(100, "Họ tên không được vượt quá 100 ký tự")
            .optional(),
        phone: z.string()
            .regex(/^(\+84|84|0)[1-9][0-9]{8}$/, "Số điện thoại không hợp lệ")
            .optional(),
        avatarUrl: z.string()
            .url("URL avatar không hợp lệ")
            .optional(),
        bio: z.string()
            .max(500, "Giới thiệu không được vượt quá 500 ký tự")
            .optional()
    }).refine((data) => Object.keys(data).length > 0, {
        message: "Cần ít nhất một trường để cập nhật"
    })
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;

export const updateUserBlockStatusSchema = z.object({
    params: z.object({
        id: z.string().min(1, "ID người dùng là bắt buộc")
    }),
    body: z.object({
        isBlocked: z.boolean()
    })
});

export const updateUserRoleSchema = z.object({
    params: z.object({
        id: z.string().min(1, "ID người dùng là bắt buộc")
    }),
    body: z.object({
        role: z.enum(['admin', 'teacher', 'student'])
    })
});

const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8}$/;

export const createUserByAdminSchema = z.object({
    body: z.object({
        email: z.string()
            .email("Email không hợp lệ")
            .trim(),
        password: z.string()
            .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
        fullName: z.string()
            .trim()
            .min(1, "Họ tên không được để trống")
            .max(100, "Họ tên không được vượt quá 100 ký tự")
            .optional(),
        role: z.enum(['admin', 'teacher', 'student']).default('student'),
        phone: z.string()
            .regex(phoneRegex, "Số điện thoại không hợp lệ")
            .optional(),
        bio: z.string()
            .max(500, "Giới thiệu không được vượt quá 500 ký tự")
            .optional()
    })
});