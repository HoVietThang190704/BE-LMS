import { ISectionRepository } from '../../repositories/ISectionRepository';
import { ISection } from '../../../models/Section';

export class GetSectionByIdUsecase {
  constructor(private sectionRepo: ISectionRepository) {}

  async execute(id: string): Promise<ISection | null> {
    return this.sectionRepo.findById(id);
  }
}
