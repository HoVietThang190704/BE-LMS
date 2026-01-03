import ExamModel from '../models/Exam';
import CourseModel from '../models/courses/Course';
import mongoose from 'mongoose';

export class ExamService {
  
  async createExam(data: any) {
    const { courseId, title, order, description, correct_answer } = data;

    if (!courseId) {
      throw new Error('courseId is required');
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const exam = new ExamModel({
      courseId,
      title,
      order,
      description,
      correct_answer
    });

    return await exam.save();
  }

  async getExams(courseId?: string) {
    let query: any = {};
    
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid courseId');
      }
      query.courseId = courseId;
    }

    return await ExamModel.find(query)
      .populate('courseId', 'name code')
      .sort({ order: 1, createdAt: -1 });
  }

  async getExamById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid exam ID');
    }

    return await ExamModel.findById(id)
      .populate('courseId', 'name code');
  }

  async updateExam(id: string, updateData: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid exam ID');
    }

    const { courseId, ...allowedUpdates } = updateData;

    if (courseId) {
      const course = await CourseModel.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      allowedUpdates.courseId = courseId;
    }

    const updated = await ExamModel.findByIdAndUpdate(
      id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).populate('courseId', 'name code');

    if (!updated) {
      throw new Error('Exam not found');
    }

    return updated;
  }

  async deleteExam(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid exam ID');
    }

    const deleted = await ExamModel.findByIdAndDelete(id);
    
    if (!deleted) {
      throw new Error('Exam not found');
    }

    return deleted;
  }
}
