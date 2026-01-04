import { Router } from 'express';
import { GradeController } from '../presentation/controllers/GradeController';
import { authenticate } from '../shared/middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Reports
 *     description: Báo cáo tiến độ học tập
 */

/**
 * @swagger
 * /api/reports/progress:
 *   get:
 *     summary: Lấy báo cáo tiến độ học tập của user hiện tại
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Báo cáo tiến độ học tập
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
 *                     streakDays:
 *                       type: number
 *                     lessonsCompleted:
 *                       type: number
 *                     exercisesCompleted:
 *                       type: string
 *                     averageScore:
 *                       type: number
 *                     courseProgress:
 *                       type: array
 *       401:
 *         description: Unauthorized
 */
router.get('/progress', authenticate, (req, res) => GradeController.getMyProgressReport(req, res));

export default router;
