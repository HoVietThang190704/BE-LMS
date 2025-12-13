import { ICourseRepository } from '../../domain/repositories/ICourseRepository';
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
  async findAllByOwner(ownerId: string, keyword?: string, page = 1, limit = 10): Promise<{ data: ICourse[], total: number }> {
  const query: any = { ownerId };
  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { code: { $regex: keyword, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  // Chạy song song 2 lệnh: đếm tổng và lấy dữ liệu
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
    const course = await CourseModel.findById(id).lean();
    if (!course) return null;
    
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

  // ==========================================
  // HÀM PHỤ (HELPER) ĐỂ SỬA LỖI TYPE
  // ==========================================
  private mapToEntity(doc: any): ICourse {
    return {
      ...doc,
      // Ép kiểu ObjectId về string thủ công để khớp với Interface ICourse
      _id: doc._id?.toString(),
      ownerId: doc.ownerId?.toString(),
      // Đảm bảo date đúng định dạng
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    } as ICourse;
  }
}