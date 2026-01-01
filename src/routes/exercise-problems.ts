import { Router } from 'express';
import { ExerciseProblemController } from '../presentation/controllers/ExerciseProblemController';

const router = Router();

if (process.env.NODE_ENV !== 'production') {
  router.get('/_ping', (_req, res) => res.json({ success: true, message: 'exercise problems router mounted' }));
}

router.post('/', (req, res) => ExerciseProblemController.create(req, res));

router.get('/', (req, res) => ExerciseProblemController.getList(req, res));

router.get('/:id', (req, res) => ExerciseProblemController.getById(req, res));

router.put('/:id', (req, res) => ExerciseProblemController.update(req, res));

router.delete('/:id', (req, res) => ExerciseProblemController.delete(req, res));

export default router;
