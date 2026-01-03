import ExerciseProblemModel from '../models/ExerciseProblem';
import CourseModel from '../models/courses/Course';
import mongoose from 'mongoose';

export class ExerciseProblemService {
  
  async createExerciseProblem(data: any) {
    const { courseId, title, order, description, temp_code, testcase } = data;

    if (!courseId) {
      throw new Error('courseId is required');
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const exerciseProblem = new ExerciseProblemModel({
      courseId,
      title,
      order,
      description,
      temp_code,
      testcase: testcase || []
    });

    return await exerciseProblem.save();
  }

  async getExerciseProblems(courseId?: string) {
    let query: any = {};
    
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid courseId');
      }
      query.courseId = courseId;
    }

    return await ExerciseProblemModel.find(query)
      .populate('courseId', 'name code')
      .sort({ order: 1, createdAt: -1 });
  }

  async getExerciseProblemById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid exercise ID');
    }

    return await ExerciseProblemModel.findById(id)
      .populate('courseId', 'name code');
  }

  async updateExerciseProblem(id: string, updateData: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid exercise ID');
    }

    const { courseId, ...allowedUpdates } = updateData;

    if (courseId) {
      const course = await CourseModel.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      allowedUpdates.courseId = courseId;
    }

    const updated = await ExerciseProblemModel.findByIdAndUpdate(
      id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).populate('courseId', 'name code');

    if (!updated) {
      throw new Error('Exercise not found');
    }

    return updated;
  }

  async deleteExerciseProblem(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid exercise ID');
    }

    const deleted = await ExerciseProblemModel.findByIdAndDelete(id);
    
    if (!deleted) {
      throw new Error('Exercise not found');
    }

    return deleted;
  }
}
