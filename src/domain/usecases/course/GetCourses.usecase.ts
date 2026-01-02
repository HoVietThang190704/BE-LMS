import { ICourse } from "../../entities/Course.entity";
import { CourseStatus, ICourseRepository } from "../../repositories/ICourseRepository";

type GetCoursesParams = {
  ownerId: string;
  role: string;
  keyword?: string;
  status?: CourseStatus;
  page?: number;
  limit?: number;
};

export class GetCoursesUseCase {
  constructor(private courseRepo: ICourseRepository) {}

  /**
   * Đã cập nhật thêm page và limit theo yêu cầu
   */
  async execute({ ownerId, role, keyword, status, page = 1, limit = 10 }: GetCoursesParams): Promise<{ data: ICourse[], total: number }> {
    if (role === 'admin') {
      return this.courseRepo.findAllForAdmin(keyword, status, page, limit);
    }

    return this.courseRepo.findAllByOwner(ownerId, keyword, status, page, limit);
  }
}