import { Router } from 'express';
import { ClassroomController } from '../presentation/controllers/ClassroomController';
import { authenticate } from '../shared/middleware/auth';
import { isTeacherOrAdmin } from '../shared/middleware/authorize';
import { validate } from '../shared/middleware/validate';
import { createLessonSchema, updateLessonSchema } from '../shared/validation/lesson.schema';

const router = Router();

router.get('/:courseId', ClassroomController.getClassroom);
router.get('/:courseId/lessons', ClassroomController.listLessons);
router.post(
  '/:courseId/lessons',
  authenticate,
  isTeacherOrAdmin,
  validate(createLessonSchema),
  ClassroomController.createLesson
);
router.put(
  '/:courseId/lessons/:lessonId',
  authenticate,
  isTeacherOrAdmin,
  validate(updateLessonSchema),
  ClassroomController.updateLesson
);
router.delete(
  '/:courseId/lessons/:lessonId',
  authenticate,
  isTeacherOrAdmin,
  ClassroomController.deleteLesson
);

export default router;
