// src/services/CourseService.ts
import CourseModel from '../models/courses/Course';
// import SectionModel from '../models/Section'; // TODO: Import model Section khi bạn đã tạo

export class CourseService {
  
  async createCourse(data: any) {
    // Logic: ownerId sẽ được controller truyền vào từ token
    const course = new CourseModel(data);
    return await course.save();
  }

  async getCourses(ownerId: string, keyword?: string) {
    let query: any = { ownerId };
    
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } }
      ];
    }
    return await CourseModel.find(query).sort({ createdAt: -1 });
  }

  async updateCourse(id: string, userId: string, updateData: any) {
    // Chỉ cho phép update nếu đúng ownerId
    // Loại bỏ code và ownerId khỏi updateData để tránh user sửa bậy
    const { code, ownerId, ...allowedUpdates } = updateData;
    
    return await CourseModel.findOneAndUpdate(
      { _id: id, ownerId: userId },
      allowedUpdates,
      { new: true }
    );
  }

  async deleteCourse(id: string, userId: string) {
    // 1. Kiểm tra môn học có tồn tại và thuộc về user không
    const course = await CourseModel.findOne({ _id: id, ownerId: userId });
    if (!course) throw new Error('Course not found or permission denied');

    // 2. Logic kiểm tra ràng buộc (Theo yêu cầu User Story)
    // const sectionsCount = await SectionModel.countDocuments({ courseId: id });
    const sectionsCount = 0; // Giả lập = 0. Khi nào có bảng Section thì thay dòng trên.
    
    if (sectionsCount > 0) {
      throw new Error('Cannot delete course because it has linked sections.');
    }

    // 3. Xóa cứng
    return await CourseModel.findByIdAndDelete(id);
  }
}