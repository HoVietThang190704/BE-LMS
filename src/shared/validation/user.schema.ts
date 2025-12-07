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