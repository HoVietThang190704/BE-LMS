import { ISection } from '../../models/Section';

export interface ISectionRepository {
  create(section: Partial<ISection>): Promise<ISection>;
  findById(id: string): Promise<ISection | null>;
  findAll(filter: any): Promise<ISection[]>;
  updateById(id: string, update: Partial<ISection>): Promise<ISection | null>;
  deleteById(id: string): Promise<boolean>;
  countEnrollments(sectionId: string): Promise<number>;
}
