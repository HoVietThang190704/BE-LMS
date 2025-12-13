import { ICourse } from "../../entities/Course.entity";
import { ICourseRepository } from "../../repositories/ICourseRepository";

export class GetCoursesUseCase {
  constructor(private courseRepo: ICourseRepository) {}

  /**
   * Đã cập nhật thêm page và limit theo yêu cầu
   */
  async execute(ownerId: string, keyword?: string, page: number = 1, limit: number = 10): Promise<{ data: ICourse[], total: number }> {
    // Gọi xuống Repo (Repo này ở các bước trước mình đã hướng dẫn viết có page/limit rồi)
    const result = await this.courseRepo.findAllByOwner(ownerId, keyword, page, limit);
    
    // Trả về cả data và total để Controller hiển thị phân trang
    return result; 
  }
}