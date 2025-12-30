import { IEnrollmentRepository } from '../../repositories/IEnrollmentRepository';

export class GetEnrolledCourseIdsUseCase {
  constructor(private enrollmentRepo: IEnrollmentRepository) {}

  async execute(userId: string): Promise<string[]> {
    return this.enrollmentRepo.findCourseIdsByUser(userId);
  }
}
