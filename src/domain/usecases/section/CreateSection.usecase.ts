import { ISectionRepository } from '../../repositories/ISectionRepository';
import { ISection } from '../../../models/Section';

export class CreateSectionUsecase {
  constructor(private sectionRepo: ISectionRepository) {}

  async execute(data: Partial<ISection>, teacherId: string): Promise<ISection> {
    // Validate courseId, startDate < endDate
    if (!data.courseId) throw new Error('courseId is required');
    if (!data.startDate || !data.endDate || new Date(data.endDate) <= new Date(data.startDate)) {
      throw new Error('endDate must be after startDate');
    }
    // Set teacherId, status
    data.teacherId = teacherId as any;
    data.status = 'planned';
    return this.sectionRepo.create(data);
  }
}
