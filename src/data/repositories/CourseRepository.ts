import { CourseStatus, ICourseRepository } from '../../domain/repositories/ICourseRepository';
import CourseModel from '../../models/courses/Course';
import { ICourse } from '../../domain/entities/Course.entity';

export class CourseRepository implements ICourseRepository {
  
  // 1. Tạo mới môn học
  async create(courseData: ICourse): Promise<ICourse> {
    const newCourse = new CourseModel(courseData);
    const savedCourse = await newCourse.save();
    
    // Sửa lỗi: Convert object mongoose sang entity chuẩn
    return this.mapToEntity(savedCourse.toObject()); 
  }

  // 2. Lấy danh sách môn học
  async findAllByOwner(
    ownerId: string,
    keyword?: string,
    status?: CourseStatus,
    page = 1,
    limit = 10
  ): Promise<{ data: ICourse[], total: number }> {
    const query: Record<string, unknown> = { ownerId };
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      CourseModel.countDocuments(query),
      CourseModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
    ]);

    return {
      total,
      data: docs.map(doc => this.mapToEntity(doc))
    };
  }

  async findAllForAdmin(
    keyword?: string,
    status?: CourseStatus,
    page = 1,
    limit = 10
  ): Promise<{ data: ICourse[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      CourseModel.countDocuments(query),
      CourseModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
    ]);

    return {
      total,
      data: docs.map((doc) => this.mapToEntity(doc))
    };
  }

  // Public list (no owner filter)
  async findAll(keyword?: string, page = 1, limit = 10): Promise<{ data: ICourse[], total: number }> {
    const query: any = { status: 'active' };
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      CourseModel.countDocuments(query),
      CourseModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
    ]);

    return {
      total,
      data: docs.map(doc => this.mapToEntity(doc))
    };
  }

  // 3. Tìm môn học theo ID
  async findById(id: string): Promise<ICourse | null> {
    // populate owner basic info for public details
    const course = await CourseModel.findById(id).populate('ownerId', 'fullName email').lean();
    if (!course) return null;
    
    // If owner populated, ensure instructor field is set
    if (course.ownerId && !course.instructor) {
      course.instructor = course.ownerId.fullName || course.ownerId.email || course.instructor;
    }

    // Sửa lỗi: Convert
    return this.mapToEntity(course);
  }

  // 4. Xóa môn học
  async delete(id: string): Promise<boolean> {
    const result = await CourseModel.findByIdAndDelete(id);
    return !!result;
  }

  // 5. Cập nhật môn học
  async update(id: string, data: Partial<ICourse>): Promise<ICourse | null> {
    const updatedCourse = await CourseModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!updatedCourse) return null;

    // Sửa lỗi: Convert
    return this.mapToEntity(updatedCourse);
  }

  async incrementEnrolledCount(id: string, delta: number): Promise<ICourse | null> {
    const updatedCourse = await CourseModel.findByIdAndUpdate(
      id,
      { $inc: { enrolled: delta } },
      { new: true }
    ).lean();

    return updatedCourse ? this.mapToEntity(updatedCourse) : null;
  }

  // ==========================================
  // HÀM PHỤ (HELPER) ĐỂ SỬA LỖI TYPE
  // ==========================================
  private mapToEntity(doc: any): ICourse {
    return {
      ...doc,
      // Ép kiểu ObjectId về string thủ công để khớp với Interface ICourse
      _id: doc._id?.toString(),
      ownerId: doc.ownerId?._id?.toString ? doc.ownerId._id.toString() : (doc.ownerId?.toString ? doc.ownerId.toString() : doc.ownerId),
      credits: doc.credits,
      instructor: doc.instructor,
      schedule: doc.schedule,
      room: doc.room,
      enrolled: doc.enrolled,
      capacity: doc.capacity,
      syllabus: doc.syllabus,
      isEnrolled: doc.isEnrolled,
      // Đảm bảo date đúng định dạng
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    } as ICourse;
  }
}