import { ICourseRepository } from "../../repositories/ICourseRepository";

export class GetPublicCourseByIdUseCase {
  constructor(private courseRepo: ICourseRepository) {}

  async execute(id: string) {
    const course = await this.courseRepo.findById(id);

    if (!course) {
      throw new Error("Course not found");
    }

    return course;
  }
}