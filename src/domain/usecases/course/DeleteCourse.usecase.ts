import { ICourseRepository } from "../../repositories/ICourseRepository";
// Giả sử bạn cũng có ISectionRepository
// import { ISectionRepository } from "../../repositories/ISectionRepository"; 

export class DeleteCourseUseCase {
  constructor(
    private courseRepo: ICourseRepository,
    // private sectionRepo: ISectionRepository 
  ) {}

  async execute(courseId: string, ownerId: string): Promise<void> {
    // 1. Kiểm tra tồn tại & quyền chủ sở hữu
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("Course not found");
    if (course.ownerId !== ownerId) throw new Error("Permission denied");

    // 2. Check Business Rule: Không xóa nếu có Section
    // const hasSections = await this.sectionRepo.countByCourseId(courseId);
    const hasSections = 0; // Tạm thời hardcode, bạn thay bằng repo thật
    
    if (hasSections > 0) {
      throw new Error("Cannot delete course. It has linked sections.");
    }

    // 3. Xóa
    await this.courseRepo.delete(courseId);
  }
}