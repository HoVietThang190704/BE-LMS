import { ValidationError, NotFoundError } from '../../../shared/middleware/errorHandler';
import { IEnrollmentRepository } from '../../repositories/IEnrollmentRepository';
import { ICourseRepository } from '../../repositories/ICourseRepository';
import { IEnrollmentEntity } from '../../entities/Enrollment.entity';
import { ICourse } from '../../entities/Course.entity';

export type EnrollCourseResult = {
  enrollment: IEnrollmentEntity;
  course: ICourse;
  alreadyEnrolled: boolean;
};

export class EnrollCourseUseCase {
  constructor(
    private enrollmentRepo: IEnrollmentRepository,
    private courseRepo: ICourseRepository
  ) {}

  async execute(userId: string, courseId: string, sectionId?: string | null): Promise<EnrollCourseResult> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.status === 'archived') {
      throw new ValidationError('Course is archived');
    }

    const existing = await this.enrollmentRepo.findOne(userId, courseId);
    if (existing) {
      return { enrollment: existing, course, alreadyEnrolled: true };
    }

    const capacity = course.capacity ?? 0;
    if (capacity > 0) {
      const enrolledCount = await this.enrollmentRepo.countByCourse(courseId);
      if (enrolledCount >= capacity) {
        throw new ValidationError('Course is full');
      }
    }

    const enrollment = await this.enrollmentRepo.enroll(userId, courseId, sectionId ?? null);

    await this.courseRepo.incrementEnrolledCount(courseId, 1);
    const updatedCourse = (await this.courseRepo.findById(courseId)) || course;

    return { enrollment, course: { ...updatedCourse, enrolled: updatedCourse.enrolled ?? course.enrolled }, alreadyEnrolled: false };
  }
}
