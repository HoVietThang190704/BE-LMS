import { ICourseRepository } from "../../repositories/ICourseRepository";
import { UpdateCourseDTO } from "../../../shared/validation/course.schema";

export class UpdateCourseUseCase {
  constructor(private courseRepo: ICourseRepository) {}

  async execute(id: string, userId: string, role: string, updateData: UpdateCourseDTO) {
    // 1. Kiểm tra tồn tại
    const course = await this.courseRepo.findById(id);
    if (!course) throw new Error("Course not found");

    // 2. Kiểm tra quyền (Chỉ chủ sở hữu hoặc Admin mới được sửa)
    if (role !== 'admin' && course.ownerId !== userId) {
      throw new Error("Permission denied");
    }

    // 3. Update (Repo sẽ chỉ update các trường có trong updateData)
    // Lưu ý: DTO validation đã chặn 'code' và 'ownerId' từ trước, 
    // nhưng để chắc chắn, logic Repo chỉ nên nhận các field cho phép.
    const updatedCourse = await this.courseRepo.update(id, updateData);
    return updatedCourse;
  }
}