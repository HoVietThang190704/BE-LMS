import { Router } from 'express';
import { authenticate } from '../shared/middleware/auth';
import { isTeacherOrAdmin } from '../shared/middleware/authorize';
import { ClassroomManagementController } from '../presentation/controllers/ClassroomManagementController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Classroom Management
 *     description: Quản lý lớp học cho giảng viên
 */

/**
 * @swagger
 * /api/classroom-management/{courseId}/students:
 *   get:
 *     summary: Lấy danh sách sinh viên trong khóa học
 *     tags: [Classroom Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách sinh viên
 */
router.get(
  '/:courseId/students',
  authenticate,
  isTeacherOrAdmin,
  (req, res) => ClassroomManagementController.getStudentsByCourse(req, res)
);

/**
 * @swagger
 * /api/classroom-management/{courseId}/grades:
 *   get:
 *     summary: Lấy điểm của tất cả sinh viên trong khóa học
 *     tags: [Classroom Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bảng điểm sinh viên
 */
router.get(
  '/:courseId/grades',
  authenticate,
  isTeacherOrAdmin,
  (req, res) => ClassroomManagementController.getStudentGradesByCourse(req, res)
);

/**
 * @swagger
 * /api/classroom-management/{courseId}/add-student:
 *   post:
 *     summary: Thêm sinh viên vào khóa học bằng email
 *     tags: [Classroom Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thêm sinh viên thành công
 */
router.post(
  '/:courseId/add-student',
  authenticate,
  isTeacherOrAdmin,
  (req, res) => ClassroomManagementController.addStudentByEmail(req, res)
);

/**
 * @swagger
 * /api/classroom-management/{courseId}/add-students-bulk:
 *   post:
 *     summary: Thêm nhiều sinh viên vào khóa học bằng danh sách email
 *     tags: [Classroom Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emails:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Kết quả thêm sinh viên
 */
router.post(
  '/:courseId/add-students-bulk',
  authenticate,
  isTeacherOrAdmin,
  (req, res) => ClassroomManagementController.addStudentsBulk(req, res)
);

/**
 * @swagger
 * /api/classroom-management/{courseId}/remove-student/{userId}:
 *   delete:
 *     summary: Xóa sinh viên khỏi khóa học
 *     tags: [Classroom Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa sinh viên thành công
 */
router.delete(
  '/:courseId/remove-student/:userId',
  authenticate,
  isTeacherOrAdmin,
  (req, res) => ClassroomManagementController.removeStudent(req, res)
);

export default router;
