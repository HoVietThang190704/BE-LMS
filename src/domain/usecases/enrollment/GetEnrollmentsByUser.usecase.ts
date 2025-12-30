import { IEnrollmentRepository } from '../../repositories/IEnrollmentRepository';
import { IEnrollmentEntity } from '../../entities/Enrollment.entity';

export type EnrollmentWithCourse = IEnrollmentEntity & { course?: any };

export class GetEnrollmentsByUserUseCase {
  constructor(private enrollmentRepo: IEnrollmentRepository) {}

  async execute(userId: string): Promise<EnrollmentWithCourse[]> {
    return this.enrollmentRepo.findByUserWithCourse(userId);
  }
}
