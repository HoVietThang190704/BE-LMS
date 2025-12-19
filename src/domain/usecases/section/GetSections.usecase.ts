import { ISectionRepository } from '../../repositories/ISectionRepository';
import { ISection } from '../../../models/Section';

export class GetSectionsUsecase {
  constructor(private sectionRepo: ISectionRepository) {}

  async execute(filter: any): Promise<ISection[]> {
    return this.sectionRepo.findAll(filter);
  }
}
