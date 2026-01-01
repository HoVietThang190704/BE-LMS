import { Router } from 'express';
import { ExamController } from '../presentation/controllers/ExamController';

const router = Router();

if (process.env.NODE_ENV !== 'production') {
  router.get('/_ping', (_req, res) => res.json({ success: true, message: 'exams router mounted' }));
}

/**
 * @swagger
 * /api/exams:
 *   post:
 *     summary: Create new exam
 *     tags: [Exams]
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
 *               - description
 *               - correct_answer
 *             properties:
 *               courseId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               title:
 *                 type: string
 *                 example: Chapter 1 Quiz
 *               order:
 *                 type: number
 *                 example: 1
 *               description:
 *                 type: string
 *                 example: Multiple choice questions
 *               correct_answer:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                 example: A
 *     responses:
 *       201:
 *         description: Exam created successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Course not found
 */
router.post('/', (req, res) => ExamController.create(req, res));

/**
 * @swagger
 * /api/exams:
 *   get:
 *     summary: Get all exams
 *     tags: [Exams]
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of exams
 */
router.get('/', (req, res) => ExamController.getList(req, res));

/**
 * @swagger
 * /api/exams/{id}:
 *   get:
 *     summary: Get exam by ID
 *     tags: [Exams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exam details
 *       404:
 *         description: Exam not found
 */
router.get('/:id', (req, res) => ExamController.getById(req, res));

/**
 * @swagger
 * /api/exams/{id}:
 *   put:
 *     summary: Update exam
 *     tags: [Exams]
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
 *     responses:
 *       200:
 *         description: Exam updated successfully
 *       404:
 *         description: Exam not found
 */
router.put('/:id', (req, res) => ExamController.update(req, res));

/**
 * @swagger
 * /api/exams/{id}:
 *   delete:
 *     summary: Delete exam
 *     tags: [Exams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exam deleted successfully
 *       404:
 *         description: Exam not found
 */
router.delete('/:id', (req, res) => ExamController.delete(req, res));

export default router;
