import { Router } from 'express';
import { homeController } from '../presentation/controllers/HomeController';

const router = Router();

router.get('/', (req, res) => homeController.getDashboard(req, res));
router.get('/courses', (req, res) => homeController.listCourses(req, res));

export default router;
