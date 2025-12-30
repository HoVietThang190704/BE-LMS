import { Router } from 'express';
import Exercise from '../models/exercises/Exercise';
import { HTTP_STATUS } from '../shared/constants/httpStatus';

const router = Router();

// Dev ping
if (process.env.NODE_ENV !== 'production') {
  router.get('/_ping', (_req, res) => res.json({ success: true, message: 'exercises router mounted' }));
}

// GET /api/exercises - list exercises (with optional ?limit & ?page)
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const page = Math.max(0, Number(req.query.page) || 0);
    const exercises = await Exercise.find().skip(page * limit).limit(limit).lean();
    res.status(HTTP_STATUS.OK).json({ success: true, data: exercises });
  } catch (err: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
  }
});

// GET /api/exercises/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findById(id).lean();
    if (!exercise) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Exercise not found' });
    res.json({ success: true, data: exercise });
  } catch (err: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
  }
});

// POST /api/exercises/submit - store submission (optional, minimal)
router.post('/submit', async (req, res) => {
  try {
   const payload = req.body;
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: payload, message: 'Submission received' });
  } catch (err: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
  }
});

export default router;
