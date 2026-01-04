import { z } from 'zod';

const resourceSchema = z.object({
  name: z.string().trim().min(1, 'Tên tài nguyên là bắt buộc'),
  type: z.enum(['link', 'file'] as const, { message: 'Loại tài nguyên không hợp lệ' }),
  url: z.string().trim().min(1, 'Đường dẫn tài nguyên là bắt buộc'),
  size: z.coerce.number().int().positive().optional(),
  mimeType: z.string().trim().optional(),
});

export const createLessonSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Tiêu đề bài học là bắt buộc'),
    description: z.string().trim().max(5000).optional(),
    week: z.coerce.number().int().positive('Tuần học phải lớn hơn 0'),
    order: z.coerce.number().int().min(0).optional().default(0),
    durationMinutes: z.coerce.number().int().min(1).max(600).optional(),
    resources: z.array(resourceSchema).optional().default([]),
    isPublished: z.boolean().optional().default(true),
  }),
});

export const updateLessonSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().max(5000).optional(),
    week: z.coerce.number().int().positive().optional(),
    order: z.coerce.number().int().min(0).optional(),
    durationMinutes: z.coerce.number().int().min(1).max(600).optional(),
    resources: z.array(resourceSchema).optional(),
    isPublished: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, { message: 'Cần ít nhất một trường để cập nhật' }),
});
