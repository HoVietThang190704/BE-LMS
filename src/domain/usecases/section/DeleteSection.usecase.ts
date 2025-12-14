import { ISectionRepository } from '../../repositories/ISectionRepository';

export class DeleteSectionUsecase {
  constructor(private sectionRepo: ISectionRepository) {}

  async execute(id: string): Promise<boolean> {
    // Check enrollments
    const count = await this.sectionRepo.countEnrollments(id);
    if (count > 0) throw new Error('Section has enrollments, cannot delete');
    return this.sectionRepo.deleteById(id);
  }
}
