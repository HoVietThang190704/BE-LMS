import { Router } from 'express';
import { ExamController } from '../presentation/controllers/ExamController';

const router = Router();

if (process.env.NODE_ENV !== 'production') {
  router.get('/_ping', (_req, res) => res.json({ success: true, message: 'exams router mounted' }));
}

router.post('/', (req, res) => ExamController.create(req, res));

router.get('/', (req, res) => ExamController.getList(req, res));

router.get('/:id', (req, res) => ExamController.getById(req, res));

router.put('/:id', (req, res) => ExamController.update(req, res));

router.delete('/:id', (req, res) => ExamController.delete(req, res));

export default router;
