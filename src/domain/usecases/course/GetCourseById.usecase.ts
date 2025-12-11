import { ICourseRepository } from "../../repositories/ICourseRepository";

export class GetCourseByIdUseCase {
  constructor(private courseRepo: ICourseRepository) {}

  async execute(id: string, userId: string, role: string) {
    const course = await this.courseRepo.findById(id);
    
    if (!course) {
      throw new Error("Course not found");
    }

    // Logic phân quyền:
    // - Admin được xem tất cả
    // - Teacher chỉ được xem môn của mình
    if (role !== 'admin' && course.ownerId !== userId) {
      throw new Error("Permission denied");
    }
    
    return course;
  }
}