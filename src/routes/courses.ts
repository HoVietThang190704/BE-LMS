import { Router } from 'express';
import { courseController } from '../di/container';
import { authenticate } from '../shared/middleware/auth';
import { isTeacherOrAdmin } from '../shared/middleware/authorize';
import { validate } from '../shared/middleware/validate';
import { createCourseSchema, updateCourseSchema } from '../shared/validation/course.schema';

export const courseRoutes = Router();

// Dev-only ping endpoint to confirm router is mounted
if (process.env.NODE_ENV !== 'production') {
  courseRoutes.get('/_ping', (_req, res) => res.json({ success: true, message: 'courses router mounted' }));
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64af9f6b...
 *         code:
 *           type: string
 *           example: CS101
 *         name:
 *           type: string
 *           example: Nhập môn lập trình
 *         description:
 *           type: string
 *           example: Khóa học nhập môn lập trình với Python
 *         ownerId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["python", "basic"]
 *         status:
 *           type: string
 *           enum:
 *             - active
 *             - archived
 *           example: active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   - name: Courses
 *     description: Quản lý môn học (Dành cho Giáo viên/Admin)
 */

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Tạo môn học mới
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 example: CS101
 *                 description: Mã môn học (duy nhất)
 *               name:
 *                 type: string
 *                 example: Lập trình Python cơ bản
 *                 description: Tên môn học
 *               description:
 *                 type: string
 *                 example: Khóa học nhập môn lập trình với Python
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["python", "basic", "coding"]
 *     responses:
 *       201:
 *         description: Tạo môn học thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc mã môn đã tồn tại
 *       401:
 *         description: Chưa đăng nhập
 */
courseRoutes.post(
  '/',
  authenticate,
  isTeacherOrAdmin,
  validate(createCourseSchema),
  (req, res) => courseController.create(req, res)
);

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Lấy danh sách môn học của giáo viên hiện tại
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mã môn
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */
courseRoutes.get(
  '/',
  authenticate,
  isTeacherOrAdmin,
  (req, res) => courseController.getList(req, res)
);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Lấy thông tin môn học theo ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của môn học
 *     responses:
 *       200:
 *         description: Trả về thông tin môn học
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Không tìm thấy môn học
 *       401:
 *         description: Chưa đăng nhập hoặc không có quyền
 */
courseRoutes.get(
  '/:id',
  authenticate,
  isTeacherOrAdmin,
  (req, res) => courseController.getDetail(req, res)
);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Cập nhật thông tin môn học
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của môn học cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: CS101
 *                 description: Mã môn học (không bắt buộc khi cập nhật)
 *               name:
 *                 type: string
 *                 example: Lập trình Python nâng cao
 *               description:
 *                 type: string
 *                 example: Nội dung cập nhật cho khóa học
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["python", "advanced"]
 *     responses:
 *       200:
 *         description: Cập nhật môn học thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy môn học
 *       401:
 *         description: Chưa đăng nhập hoặc không có quyền
 */
courseRoutes.put(
  '/:id',
  authenticate,
  isTeacherOrAdmin,
  validate(updateCourseSchema),
  (req, res) => courseController.update(req, res)
);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Xóa môn học (Kiểm tra ràng buộc Section)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của môn học cần xóa
 *     responses:
 *       200:
 *         description: Xóa môn học thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Xóa môn học thành công
 *       400:
 *         description: Không thể xóa do môn học đã có lớp học phần (Sections)
 *       404:
 *         description: Không tìm thấy môn học
 *       401:
 *         description: Chưa đăng nhập hoặc không có quyền sở hữu
 */
courseRoutes.delete(
  '/:id',
  authenticate,
  isTeacherOrAdmin,
  (req, res) => courseController.delete(req, res)
);

export default courseRoutes;