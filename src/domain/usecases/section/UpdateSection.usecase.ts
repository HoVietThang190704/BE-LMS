import { ISectionRepository } from '../../repositories/ISectionRepository';
import { ISection } from '../../../models/Section';

export class UpdateSectionUsecase {
  constructor(private sectionRepo: ISectionRepository) {}

  async execute(id: string, update: Partial<ISection>): Promise<ISection | null> {
    // Only allow update: schedule, room, status
    const allowed: (keyof ISection)[] = ['schedule', 'status'];
    const filtered: Partial<ISection> = {};
    for (const key of allowed) {
      if (update[key] !== undefined) filtered[key] = update[key];
    }
    return this.sectionRepo.updateById(id, filtered);
  }
}
