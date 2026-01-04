import EnrollmentModel, { IEnrollment } from '../../models/Enrollment';
import { IEnrollmentRepository } from '../../domain/repositories/IEnrollmentRepository';
import { IEnrollmentEntity } from '../../domain/entities/Enrollment.entity';

function mapToEntity(doc: Partial<IEnrollment>): IEnrollmentEntity {
  return {
    _id: doc._id?.toString(),
    userId: doc.userId?.toString() || '',
    courseId: doc.courseId?.toString() || '',
    sectionId: doc.sectionId ? doc.sectionId.toString() : null,
    status: (doc as any).status || 'approved',
    enrolledAt: doc.enrolledAt || new Date(),
  };
}

export class EnrollmentRepository implements IEnrollmentRepository {
  async enroll(userId: string, courseId: string, sectionId: string | null = null, status: 'pending' | 'approved' | 'rejected' = 'approved'): Promise<IEnrollmentEntity> {
    const created = await EnrollmentModel.create({ userId, courseId, sectionId, status });
    return mapToEntity(created.toObject());
  }

  async findOne(userId: string, courseId: string): Promise<IEnrollmentEntity | null> {
    const existing = await EnrollmentModel.findOne({ userId, courseId }).lean();
    return existing ? mapToEntity(existing as any) : null;
  }

  async findByUser(userId: string): Promise<IEnrollmentEntity[]> {
    const docs = await EnrollmentModel.find({ userId }).sort({ enrolledAt: -1 }).lean();
    return docs.map((doc: any) => mapToEntity(doc));
  }

  async findByUserWithCourse(userId: string): Promise<Array<IEnrollmentEntity & { course?: any }>> {
    const docs = await EnrollmentModel.find({ userId })
      .sort({ enrolledAt: -1 })
      .populate('courseId')
      .lean();

    return docs.map((doc: any) => ({
      ...mapToEntity(doc),
      course: doc.courseId,
    }));
  }

  async countByCourse(courseId: string): Promise<number> {
    return EnrollmentModel.countDocuments({ courseId, status: 'approved' }).exec();
  }

  async findCourseIdsByUser(userId: string, statuses: Array<'pending' | 'approved' | 'rejected'> = ['approved']): Promise<string[]> {
    const docs = await EnrollmentModel.find({ userId, status: { $in: statuses } }).select('courseId').lean();
    return docs.map((doc) => doc.courseId?.toString()).filter(Boolean) as string[];
  }
}
