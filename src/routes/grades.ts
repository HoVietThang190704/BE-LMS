import { Router } from 'express';
import { GradeController } from '../presentation/controllers/GradeController';
import { authenticate } from '../shared/middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Grades
 *     description: Quản lý bảng điểm
 */

/**
 * @swagger
 * /api/grades:
 *   get:
 *     summary: Lấy bảng điểm của user hiện tại
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bảng điểm của user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     semester:
 *                       type: string
 *                     gpaThisSemester:
 *                       type: number
 *                     gpaAccumulated:
 *                       type: number
 *                     creditsThisSemester:
 *                       type: number
 *                     creditsAccumulated:
 *                       type: number
 *                     courses:
 *                       type: array
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, (req, res) => GradeController.getMyGrades(req, res));

export default router;
