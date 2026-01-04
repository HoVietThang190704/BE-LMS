import { IEnrollmentEntity } from '../entities/Enrollment.entity';

export interface IEnrollmentRepository {
  enroll(userId: string, courseId: string, sectionId?: string | null, status?: 'pending' | 'approved' | 'rejected'): Promise<IEnrollmentEntity>;
  findByUser(userId: string): Promise<IEnrollmentEntity[]>;
  findByUserWithCourse(userId: string): Promise<Array<IEnrollmentEntity & { course?: any }>>;
  findOne(userId: string, courseId: string): Promise<IEnrollmentEntity | null>;
  countByCourse(courseId: string): Promise<number>;
  findCourseIdsByUser(userId: string, statuses?: Array<'pending' | 'approved' | 'rejected'>): Promise<string[]>;
}
