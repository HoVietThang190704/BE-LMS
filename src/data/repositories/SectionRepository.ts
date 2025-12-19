import SectionModel, { ISection } from '../../models/Section';
import { ISectionRepository } from '../../domain/repositories/ISectionRepository';
import EnrollmentModel from '../../models/Enrollment'; // Giả định sẽ tạo file này

export class SectionRepository implements ISectionRepository {
  async create(section: Partial<ISection>): Promise<ISection> {
    return SectionModel.create(section);
  }

  async findById(id: string): Promise<ISection | null> {
    return SectionModel.findById(id)
      .populate('courseId', 'name code')
      .populate('teacherId', 'name email')
      .exec();
  }

  async findAll(filter: any): Promise<ISection[]> {
    return SectionModel.find(filter)
      .populate('courseId', 'name code')
      .populate('teacherId', 'name email')
      .exec();
  }

  async updateById(id: string, update: Partial<ISection>): Promise<ISection | null> {
    return SectionModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const res = await SectionModel.findByIdAndDelete(id).exec();
    return !!res;
  }

  async countEnrollments(sectionId: string): Promise<number> {
    return EnrollmentModel.countDocuments({ sectionId }).exec();
  }
}
