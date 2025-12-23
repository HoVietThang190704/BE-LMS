import { ISectionRepository } from '../../repositories/ISectionRepository';
import { ISection } from '../../../models/Section';

export class CreateSectionUsecase {
  constructor(private sectionRepo: ISectionRepository) {}

  async execute(data: Partial<ISection>, teacherId: string): Promise<ISection> {
    // Validate courseId, startDate < endDate, maxStudents > 0, term hợp lệ
    if (!data.courseId) throw new Error('courseId is required');
    if (!data.startDate || !data.endDate || new Date(data.endDate) <= new Date(data.startDate)) {
      throw new Error('endDate must be after startDate');
    }
    if (typeof data.maxStudents !== 'number' || data.maxStudents <= 0) {
      throw new Error('max student must be more than 0');
    }
    const validTerms = ['2023-2024', '2024-2025', '2025-2026'];
    if (!data.term || !validTerms.includes(data.term)) {
      throw new Error('Term must be 2023-2024,2024-2025,2025-2026');
    }
    // Set teacherId, status
    data.teacherId = teacherId as any;
    data.status = 'planned';
    return this.sectionRepo.create(data);
  }
}
