import CourseLessonModel, { ICourseLesson } from '../../models/CourseLesson';

export class CourseLessonRepository {
  async create(courseId: string, payload: Partial<ICourseLesson>): Promise<ICourseLesson> {
    return CourseLessonModel.create({ ...payload, courseId });
  }

  async listByCourse(courseId: string): Promise<ICourseLesson[]> {
    return CourseLessonModel.find({ courseId })
      .sort({ week: 1, order: 1, createdAt: 1 })
      .exec();
  }

  async update(courseId: string, lessonId: string, payload: Partial<ICourseLesson>): Promise<ICourseLesson | null> {
    return CourseLessonModel.findOneAndUpdate({ _id: lessonId, courseId }, payload, { new: true })
      .exec();
  }

  async delete(courseId: string, lessonId: string): Promise<boolean> {
    const result = await CourseLessonModel.deleteOne({ _id: lessonId, courseId }).exec();
    return result.deletedCount === 1;
  }
}
