import { z } from "zod";

// Schema for creating a new course
export const createCourseSchema = z.object({
    body: z.object({
        // Cách sửa: Bỏ object { required_error... } bên trong z.string()
        // z.string() mặc định là required. Nếu rỗng string thì .min(1) sẽ bắt lỗi.
        code: z.string()
            .trim()
            .min(1, "Mã môn học là bắt buộc") 
            .transform(val => val.toUpperCase()), 
            
        name: z.string()
            .trim()
            .min(3, "Tên môn học phải có ít nhất 3 ký tự")
            .max(200, "Tên môn học không được vượt quá 200 ký tự"),
            
        description: z.string()
            .optional(),

        image: z.string()
            .optional(),
            
        tags: z.array(z.string())
            .optional()
            .default([])
    })
});

// Schema for updating course
export const updateCourseSchema = z.object({
    body: z.object({
        name: z.string()
            .trim()
            .min(3, "Tên môn học phải có ít nhất 3 ký tự")
            .max(200, "Tên môn học không được vượt quá 200 ký tự")
            .optional(),
            
        description: z.string()
            .optional(),

        image: z.string()
            .optional(),
            
        tags: z.array(z.string())
            .optional(),
            
        // Cách sửa: Bỏ { errorMap... } vì gây lỗi type.
        // Zod sẽ tự báo lỗi chuẩn nếu giá trị không nằm trong enum.
        status: z.enum(["active", "archived"])
            .optional()
    }).refine((data) => Object.keys(data).length > 0, {
        message: "Cần ít nhất một trường để cập nhật"
    })
});

// Export types inferred from schemas
export type CreateCourseDTO = z.infer<typeof createCourseSchema>['body'];
export type UpdateCourseDTO = z.infer<typeof updateCourseSchema>['body'];