import { ICourse } from "../../entities/Course.entity";
import { ICourseRepository } from "../../repositories/ICourseRepository";

export class GetPublicCoursesUseCase {
  constructor(private courseRepo: ICourseRepository) {}

  async execute(keyword?: string, page: number = 1, limit: number = 10): Promise<{ data: ICourse[]; total: number }> {
    return await this.courseRepo.findAll(keyword, page, limit);
  }
}
