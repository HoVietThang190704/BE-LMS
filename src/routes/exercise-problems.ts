import { Router } from 'express';
import { ExerciseProblemController } from '../presentation/controllers/ExerciseProblemController';

const router = Router();

if (process.env.NODE_ENV !== 'production') {
  router.get('/_ping', (_req, res) => res.json({ success: true, message: 'exercise problems router mounted' }));
}

/**
 * @swagger
 * /api/exercise-problems:
 *   post:
 *     summary: Create new exercise problem
 *     tags: [Exercise Problems]
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
 *               - temp_code
 *             properties:
 *               courseId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               title:
 *                 type: string
 *                 example: Binary Search
 *               order:
 *                 type: number
 *                 example: 1
 *               description:
 *                 type: string
 *                 example: Implement binary search algorithm
 *               temp_code:
 *                 type: string
 *                 example: def binary_search(arr, target)# Your code here
 *               testcase:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Exercise created successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Course not found
 */
router.post('/', (req, res) => ExerciseProblemController.create(req, res));

/**
 * @swagger
 * /api/exercise-problems:
 *   get:
 *     summary: Get all exercise problems
 *     tags: [Exercise Problems]
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of exercise problems
 */
router.get('/', (req, res) => ExerciseProblemController.getList(req, res));

/**
 * @swagger
 * /api/exercise-problems/{id}:
 *   get:
 *     summary: Get exercise by ID
 *     tags: [Exercise Problems]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exercise details
 *       404:
 *         description: Exercise not found
 */
router.get('/:id', (req, res) => ExerciseProblemController.getById(req, res));

/**
 * @swagger
 * /api/exercise-problems/{id}:
 *   put:
 *     summary: Update exercise
 *     tags: [Exercise Problems]
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
 *         description: Exercise updated successfully
 *       404:
 *         description: Exercise not found
 */
router.put('/:id', (req, res) => ExerciseProblemController.update(req, res));

/**
 * @swagger
 * /api/exercise-problems/{id}:
 *   delete:
 *     summary: Delete exercise
 *     tags: [Exercise Problems]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exercise deleted successfully
 *       404:
 *         description: Exercise not found
 */
router.delete('/:id', (req, res) => ExerciseProblemController.delete(req, res));

export default router;
