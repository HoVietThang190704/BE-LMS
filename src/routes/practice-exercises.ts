import { Router } from 'express';
import { PracticeExerciseController } from '../presentation/controllers/PracticeExerciseController';
import { authenticate } from '../shared/middleware/auth';
import { isTeacherOrAdmin } from '../shared/middleware/authorize';

const router = Router();

if (process.env.NODE_ENV !== 'production') {
  router.get('/_ping', (_req, res) => res.json({ success: true, message: 'practice exercises router mounted' }));
}

/**
 * @swagger
 * tags:
 *   - name: Practice Exercises
 *     description: Quản lý bài tập thực hành (code)
 */

/**
 * @swagger
 * /api/practice-exercises:
 *   post:
 *     summary: Tạo bài tập thực hành mới
 *     tags: [Practice Exercises]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - title
 *               - description
 *               - order
 *               - testCases
 *             properties:
 *               courseId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               order:
 *                 type: number
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               language:
 *                 type: string
 *               templateCode:
 *                 type: string
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     input:
 *                       type: string
 *                     expectedOutput:
 *                       type: string
 *                     isHidden:
 *                       type: boolean
 *                     points:
 *                       type: number
 *               constraints:
 *                 type: string
 *               hints:
 *                 type: array
 *     responses:
 *       201:
 *         description: Practice exercise created successfully
 */
router.post('/', authenticate, isTeacherOrAdmin, (req, res) => PracticeExerciseController.create(req, res));

/**
 * @swagger
 * /api/practice-exercises:
 *   get:
 *     summary: Lấy danh sách bài tập thực hành
 *     tags: [Practice Exercises]
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of practice exercises
 */
router.get('/', (req, res) => PracticeExerciseController.getList(req, res));

/**
 * @swagger
 * /api/practice-exercises/{id}:
 *   get:
 *     summary: Lấy chi tiết bài tập thực hành (dành cho teacher)
 *     tags: [Practice Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Practice exercise details
 */
router.get('/:id', authenticate, isTeacherOrAdmin, (req, res) => PracticeExerciseController.getById(req, res));

/**
 * @swagger
 * /api/practice-exercises/{id}/student:
 *   get:
 *     summary: Lấy bài tập thực hành cho học sinh (chỉ test cases visible)
 *     tags: [Practice Exercises]
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
 *         description: Practice exercise for student
 */
router.get('/:id/student', authenticate, (req, res) => PracticeExerciseController.getForStudent(req, res));

/**
 * @swagger
 * /api/practice-exercises/{id}:
 *   put:
 *     summary: Cập nhật bài tập thực hành
 *     tags: [Practice Exercises]
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
 *         description: Practice exercise updated
 */
router.put('/:id', authenticate, isTeacherOrAdmin, (req, res) => PracticeExerciseController.update(req, res));

/**
 * @swagger
 * /api/practice-exercises/{id}:
 *   delete:
 *     summary: Xóa bài tập thực hành
 *     tags: [Practice Exercises]
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
 *         description: Practice exercise deleted
 */
router.delete('/:id', authenticate, isTeacherOrAdmin, (req, res) => PracticeExerciseController.delete(req, res));

/**
 * @swagger
 * /api/practice-exercises/{id}/submit:
 *   post:
 *     summary: Nộp bài tập thực hành
 *     tags: [Practice Exercises]
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
 *               code:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: Practice submitted
 */
router.post('/:id/submit', authenticate, (req, res) => PracticeExerciseController.submit(req, res));

/**
 * @swagger
 * /api/practice-exercises/{id}/my-submissions:
 *   get:
 *     summary: Lấy lịch sử nộp bài của học sinh
 *     tags: [Practice Exercises]
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
 *         description: Student submissions
 */
router.get('/:id/my-submissions', authenticate, (req, res) => PracticeExerciseController.getMySubmissions(req, res));

/**
 * @swagger
 * /api/practice-exercises/{id}/my-best:
 *   get:
 *     summary: Lấy kết quả tốt nhất của học sinh
 *     tags: [Practice Exercises]
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
 *         description: Best submission
 */
router.get('/:id/my-best', authenticate, (req, res) => PracticeExerciseController.getMyBestSubmission(req, res));

/**
 * @swagger
 * /api/practice-exercises/{id}/submissions:
 *   get:
 *     summary: Lấy tất cả bài nộp (dành cho teacher)
 *     tags: [Practice Exercises]
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
 *         description: All submissions
 */
router.get('/:id/submissions', authenticate, isTeacherOrAdmin, (req, res) => PracticeExerciseController.getAllSubmissions(req, res));

export default router;
