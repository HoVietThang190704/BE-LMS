import { Router } from 'express';
import { enrollmentController } from '../di/container';

const router = Router();

router.post('/', (req, res) => enrollmentController.enroll(req, res));
router.get('/me', (req, res) => enrollmentController.getMyEnrollments(req, res));

export default router;
