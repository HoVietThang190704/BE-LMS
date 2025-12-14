import { Router } from 'express';
import { SectionController } from '../presentation/controllers/SectionController';
import { authMiddleware } from '../shared/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/sections:
 *   post:
 *     summary: Tạo lớp học mới
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               courseCode:
 *                 type: string
 *                 description: 'Mã code của môn học (bắt buộc)'
 *               term:
 *                 type: string
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                     room:
 *                       type: string
 *                   example:
 *                     dayOfWeek: 0
 *                     startTime: 'string'
 *                     endTime: 'string'
 *                     room: 'string'
 *               maxStudents:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Section created
 *       400:
 *         description: Bad request
 */
router.post('/', authMiddleware, SectionController.create);
/**
 * @swagger
 * /api/sections:
 *   get:
 *     summary: Lấy danh sách lớp học
 *     tags: [Sections]
 *     parameters:
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách lớp học
 */
router.get('/', SectionController.list);
/**
 * @swagger
 * /api/sections/{id}:
 *   get:
 *     summary: Lấy chi tiết lớp học
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin lớp học
 *       404:
 *         description: Không tìm thấy lớp học
 */
router.get('/:id', SectionController.detail);
/**
 * @swagger
 * /api/sections/{id}:
 *   put:
 *     summary: Cập nhật lớp học
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                     room:
 *                       type: string
 *                   example:
 *                     dayOfWeek: 0
 *                     startTime: 'string'
 *                     endTime: 'string'
 *                     room: 'string'
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Section updated
 *       404:
 *         description: Không tìm thấy lớp học
 */
router.put('/:id', authMiddleware, SectionController.update);
/**
 * @swagger
 * /api/sections/{id}:
 *   delete:
 *     summary: Xóa lớp học
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section deleted
 *       400:
 *         description: Không cho xóa nếu đã có học viên
 *       404:
 *         description: Không tìm thấy lớp học
 */
router.delete('/:id', authMiddleware, SectionController.delete);

export default router;
