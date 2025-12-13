import { Course, ICourse } from "../../entities/Course.entity";
import { ICourseRepository } from "../../repositories/ICourseRepository";

export class CreateCourseUseCase {
  constructor(private courseRepo: ICourseRepository) {}

  // SỬA DÒNG NÀY: Thêm 'status' vào danh sách Omit để không bắt buộc truyền vào
  async execute(input: Omit<ICourse, '_id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ICourse> {
    
    // Validate cơ bản
    if (!input.code || !input.name) {
      throw new Error("Missing required fields");
    }
    
    // Ép kiểu về Entity
    // Lúc này UseCase sẽ tự gán status = 'active'
    const newCourse = new Course(
      input.code,
      input.name,
      input.ownerId,
      undefined, // _id (để DB tự sinh)
      input.description,
      input.tags,
      'active', // <--- UseCase tự set cứng giá trị mặc định tại đây
      undefined, // createdAt
      undefined  // updatedAt
    );

    return await this.courseRepo.create(newCourse);
  }
}