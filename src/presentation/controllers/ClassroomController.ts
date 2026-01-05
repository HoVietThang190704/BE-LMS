import { Request, Response } from 'express';
import CourseModel from '../../models/courses/Course';
import { CourseLessonRepository } from '../../data/repositories/CourseLessonRepository';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';
import { progressService } from '../../services/ProgressService';
import { resolveUserId } from '../../shared/utils/userContext';
import QuizExerciseModel from '../../models/exercises/QuizExercise';
import PracticeExerciseModel from '../../models/exercises/PracticeExercise';

const lessonsRepo = new CourseLessonRepository();

const normalizeCourseId = async (courseId: string) => {
  const byId = await CourseModel.findById(courseId).lean();
  if (byId) return byId;
  return CourseModel.findOne({ code: courseId.toUpperCase() }).lean();
};

export class ClassroomController {
  static async getClassroom(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const course = await normalizeCourseId(courseId);
      if (!course) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Không tìm thấy môn học' });

      const lessons = await lessonsRepo.listByCourse(String(course._id));
      const resources = lessons.flatMap((lesson) =>
        (lesson.resources || []).map((resource) => ({
          ...resource,
          lessonId: String((lesson as any)._id),
          lessonTitle: lesson.title,
          week: lesson.week,
        }))
      );

      // Đếm tổng số bài tập (luôn lấy, không cần userId)
      const [totalQuizzes, totalPractices] = await Promise.all([
        QuizExerciseModel.countDocuments({ courseId: course._id }),
        PracticeExerciseModel.countDocuments({ courseId: course._id })
      ]);

      // Tính toán tiến độ học tập dựa trên bài tập đã hoàn thành
      let progress = 0;
      let progressDetails = {
        totalExercises: totalQuizzes + totalPractices,
        completedExercises: 0,
        quizProgress: {
          total: totalQuizzes,
          completed: 0,
          passed: 0
        },
        practiceProgress: {
          total: totalPractices,
          completed: 0,
          passed: 0
        },
        lessonProgress: {
          total: lessons.length,
          completed: 0
        }
      };

      const userId = await resolveUserId(req);
      
      if (userId) {
        try {
          const courseProgress = await progressService.getCourseProgress(String(course._id), userId);
          progress = courseProgress.progressPercent;
          progressDetails = {
            totalExercises: courseProgress.totalExercises,
            completedExercises: courseProgress.completedExercises,
            quizProgress: courseProgress.quizProgress,
            practiceProgress: courseProgress.practiceProgress,
            lessonProgress: courseProgress.lessonProgress
          };
        } catch (progressError) {
          console.warn('[ClassroomController] Failed to calculate progress:', progressError);
        }
      }

      const now = new Date();
      const isExpired = course.endDate ? new Date(course.endDate) < now : false;
      const isNotStarted = course.startDate ? new Date(course.startDate) > now : false;

      return res.json({
        success: true,
        data: {
          course: {
            id: String(course._id),
            code: course.code,
            name: course.name,
            description: course.description,
            instructor: course.instructor,
            schedule: course.schedule,
            room: course.room,
            credits: course.credits,
            totalLessons: lessons.length,
            startDate: course.startDate,
            endDate: course.endDate,
            isExpired,
            isNotStarted,
          },
          progress,
          progressDetails,
          lessons,
          resources,
        },
      });
    } catch (err: any) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: err.message || 'Không thể tải lớp học' });
    }
  }

  static async listLessons(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const course = await normalizeCourseId(courseId);
      if (!course) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Không tìm thấy môn học' });

      const lessons = await lessonsRepo.listByCourse(String(course._id));
      return res.json({ success: true, data: lessons });
    } catch (err: any) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: err.message || 'Không thể tải danh sách bài học' });
    }
  }

  static async createLesson(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const course = await normalizeCourseId(courseId);
      if (!course) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Không tìm thấy môn học' });

      const lesson = await lessonsRepo.create(String(course._id), req.body);
      return res.status(HTTP_STATUS.CREATED).json({ success: true, data: lesson });
    } catch (err: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message || 'Không thể tạo bài học' });
    }
  }

  static async updateLesson(req: Request, res: Response) {
    try {
      const { courseId, lessonId } = req.params;
      const course = await normalizeCourseId(courseId);
      if (!course) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Không tìm thấy môn học' });

      const updated = await lessonsRepo.update(String(course._id), lessonId, req.body);
      if (!updated) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Không tìm thấy bài học' });
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message || 'Không thể cập nhật bài học' });
    }
  }

  static async deleteLesson(req: Request, res: Response) {
    try {
      const { courseId, lessonId } = req.params;
      const course = await normalizeCourseId(courseId);
      if (!course) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Không tìm thấy môn học' });

      const deleted = await lessonsRepo.delete(String(course._id), lessonId);
      if (!deleted) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Không tìm thấy bài học' });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message || 'Không thể xóa bài học' });
    }
  }
}
