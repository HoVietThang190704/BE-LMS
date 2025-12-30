import { Request, Response } from 'express';
import { EnrollCourseUseCase } from '../../domain/usecases/enrollment/EnrollCourse.usecase';
import { GetEnrollmentsByUserUseCase } from '../../domain/usecases/enrollment/GetEnrollmentsByUser.usecase';
import { handleControllerError, sendFailure, sendSuccess } from '../../shared/utils/controllerUtils';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';
import { resolveUserId } from '../../shared/utils/userContext';

export class EnrollmentController {
  constructor(
    private enrollCourseUseCase: EnrollCourseUseCase,
    private getEnrollmentsByUserUseCase: GetEnrollmentsByUserUseCase
  ) {}

  async enroll(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, sectionId } = req.body || {};
      if (!courseId) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: 'courseId is required' });
        return;
      }

      const userId = await resolveUserId(req);
      if (!userId) {
        sendFailure(res, { status: HTTP_STATUS.UNAUTHORIZED, message: 'User is not authenticated' });
        return;
      }

      const { enrollment, course, alreadyEnrolled } = await this.enrollCourseUseCase.execute(userId, courseId, sectionId);

      sendSuccess(res, {
        status: alreadyEnrolled ? HTTP_STATUS.OK : HTTP_STATUS.CREATED,
        message: alreadyEnrolled ? 'Bạn đã đăng ký môn học này rồi' : 'Đăng ký môn học thành công',
        data: {
          enrollment,
          course: { ...course, isEnrolled: true }
        }
      });
    } catch (error: any) {
      handleControllerError(res, error, 'Không thể đăng ký môn học');
    }
  }

  async getMyEnrollments(req: Request, res: Response): Promise<void> {
    try {
      const userId = await resolveUserId(req);
      if (!userId) {
        sendFailure(res, { status: HTTP_STATUS.UNAUTHORIZED, message: 'User is not authenticated' });
        return;
      }

      const enrollments = await this.getEnrollmentsByUserUseCase.execute(userId);

      const mapped = enrollments.map((item) => {
        const course = item.course || {};
        const courseId = course._id?.toString?.() || course.id || item.courseId;
        return {
          id: item._id,
          courseId,
          userId: item.userId,
          enrolledAt: item.enrolledAt,
          course: {
            id: courseId,
            code: course.code,
            name: course.name,
            description: course.description,
            tags: Array.from(new Set([...(course.tags || []), 'enrolled'])),
            status: course.status,
            image: course.image,
            instructor: course.instructor,
            schedule: course.schedule,
            room: course.room,
            credits: course.credits,
            enrolled: course.enrolled,
            capacity: course.capacity,
            syllabus: course.syllabus,
            isEnrolled: true,
          }
        };
      });

      sendSuccess(res, {
        data: mapped,
        meta: { total: mapped.length }
      });
    } catch (error: any) {
      handleControllerError(res, error, 'Không thể lấy danh sách môn học đã đăng ký');
    }
  }
}
