import { Router } from 'express';
import { QuizExerciseController } from '../presentation/controllers/QuizExerciseController';
import { authenticate } from '../shared/middleware/auth';
import { isTeacherOrAdmin } from '../shared/middleware/authorize';

const router = Router();

if (process.env.NODE_ENV !== 'production') {
  router.get('/_ping', (_req, res) => res.json({ success: true, message: 'quiz exercises router mounted' }));
}

/**
 * @swagger
 * tags:
 *   - name: Quiz Exercises
 *     description: Quản lý bài tập trắc nghiệm
 */

/**
 * @swagger
 * /api/quiz-exercises:
 *   post:
 *     summary: Tạo bài tập trắc nghiệm mới
 *     tags: [Quiz Exercises]
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
 *               - order
 *               - questions
 *             properties:
 *               courseId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               order:
 *                 type: number
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     question:
 *                       type: string
 *                     options:
 *                       type: array
 *                     points:
 *                       type: number
 *               timeLimit:
 *                 type: number
 *               passingScore:
 *                 type: number
 *     responses:
 *       201:
 *         description: Quiz created successfully
 */
router.post('/', authenticate, isTeacherOrAdmin, (req, res) => QuizExerciseController.create(req, res));

/**
 * @swagger
 * /api/quiz-exercises:
 *   get:
 *     summary: Lấy danh sách bài tập trắc nghiệm
 *     tags: [Quiz Exercises]
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of quizzes
 */
router.get('/', (req, res) => QuizExerciseController.getList(req, res));

/**
 * @swagger
 * /api/quiz-exercises/{id}:
 *   get:
 *     summary: Lấy chi tiết bài tập trắc nghiệm (dành cho teacher)
 *     tags: [Quiz Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz details
 */
router.get('/:id', authenticate, isTeacherOrAdmin, (req, res) => QuizExerciseController.getById(req, res));

/**
 * @swagger
 * /api/quiz-exercises/{id}/student:
 *   get:
 *     summary: Lấy bài tập trắc nghiệm cho học sinh (không có đáp án)
 *     tags: [Quiz Exercises]
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
 *         description: Quiz for student
 */
router.get('/:id/student', authenticate, (req, res) => QuizExerciseController.getForStudent(req, res));

/**
 * @swagger
 * /api/quiz-exercises/{id}:
 *   put:
 *     summary: Cập nhật bài tập trắc nghiệm
 *     tags: [Quiz Exercises]
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
 *         description: Quiz updated
 */
router.put('/:id', authenticate, isTeacherOrAdmin, (req, res) => QuizExerciseController.update(req, res));

/**
 * @swagger
 * /api/quiz-exercises/{id}:
 *   delete:
 *     summary: Xóa bài tập trắc nghiệm
 *     tags: [Quiz Exercises]
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
 *         description: Quiz deleted
 */
router.delete('/:id', authenticate, isTeacherOrAdmin, (req, res) => QuizExerciseController.delete(req, res));

/**
 * @swagger
 * /api/quiz-exercises/{id}/submit:
 *   post:
 *     summary: Nộp bài tập trắc nghiệm
 *     tags: [Quiz Exercises]
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
 *               answers:
 *                 type: array
 *               startedAt:
 *                 type: string
 *     responses:
 *       201:
 *         description: Quiz submitted
 */
router.post('/:id/submit', authenticate, (req, res) => QuizExerciseController.submit(req, res));

/**
 * @swagger
 * /api/quiz-exercises/{id}/my-submissions:
 *   get:
 *     summary: Lấy lịch sử nộp bài của học sinh
 *     tags: [Quiz Exercises]
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
router.get('/:id/my-submissions', authenticate, (req, res) => QuizExerciseController.getMySubmissions(req, res));

/**
 * @swagger
 * /api/quiz-exercises/{id}/submissions:
 *   get:
 *     summary: Lấy tất cả bài nộp của quiz (dành cho teacher)
 *     tags: [Quiz Exercises]
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
router.get('/:id/submissions', authenticate, isTeacherOrAdmin, (req, res) => QuizExerciseController.getAllSubmissions(req, res));

export default router;
