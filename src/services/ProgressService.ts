import mongoose from 'mongoose';
import QuizExerciseModel from '../models/exercises/QuizExercise';
import PracticeExerciseModel from '../models/exercises/PracticeExercise';
import QuizSubmissionModel from '../models/exercises/QuizSubmission';
import PracticeSubmissionModel from '../models/exercises/PracticeSubmission';
import CourseLessonModel from '../models/CourseLesson';

export interface CourseProgressSummary {
  courseId: string;
  userId: string;
  totalExercises: number;
  completedExercises: number;
  quizProgress: {
    total: number;
    completed: number;
    passed: number;
  };
  practiceProgress: {
    total: number;
    completed: number;
    passed: number;
  };
  lessonProgress: {
    total: number;
    completed: number;
  };
  progressPercent: number;
}

export class ProgressService {

  async getCourseProgress(courseId: string, userId: string): Promise<CourseProgressSummary> {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid courseId');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId');
    }

    const courseObjectId = new mongoose.Types.ObjectId(courseId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Lấy tất cả quiz exercises của course
    const quizzes = await QuizExerciseModel.find({ courseId: courseObjectId }).select('_id').lean();
    const quizIds = quizzes.map(q => q._id);

    // Lấy tất cả practice exercises của course
    const practices = await PracticeExerciseModel.find({ courseId: courseObjectId }).select('_id').lean();
    const practiceIds = practices.map(p => p._id);

    // Lấy tất cả lessons của course
    const lessons = await CourseLessonModel.find({ courseId: courseObjectId, isPublished: true }).select('_id').lean();

    // Đếm số quiz đã làm (có ít nhất 1 submission)
    const completedQuizzes = await QuizSubmissionModel.distinct('quizId', {
      quizId: { $in: quizIds },
      studentId: userObjectId
    });

    // Đếm số quiz đã pass
    const passedQuizzes = await QuizSubmissionModel.distinct('quizId', {
      quizId: { $in: quizIds },
      studentId: userObjectId,
      passed: true
    });

    // Đếm số practice đã làm (có ít nhất 1 submission)
    const completedPractices = await PracticeSubmissionModel.distinct('practiceId', {
      practiceId: { $in: practiceIds },
      studentId: userObjectId
    });

    // Đếm số practice đã pass
    const passedPractices = await PracticeSubmissionModel.distinct('practiceId', {
      practiceId: { $in: practiceIds },
      studentId: userObjectId,
      passed: true
    });

    // Tính toán tiến độ
    const totalQuizzes = quizIds.length;
    const totalPractices = practiceIds.length;
    const totalLessons = lessons.length;
    const totalExercises = totalQuizzes + totalPractices;

    const completedQuizCount = completedQuizzes.length;
    const completedPracticeCount = completedPractices.length;
    const completedExercises = completedQuizCount + completedPracticeCount;

    const progressPercent = totalExercises > 0 
      ? Math.round((completedExercises / totalExercises) * 100) 
      : 0;

    return {
      courseId,
      userId,
      totalExercises,
      completedExercises,
      quizProgress: {
        total: totalQuizzes,
        completed: completedQuizCount,
        passed: passedQuizzes.length
      },
      practiceProgress: {
        total: totalPractices,
        completed: completedPracticeCount,
        passed: passedPractices.length
      },
      lessonProgress: {
        total: totalLessons,
        completed: 0 
      },
      progressPercent
    };
  }

  async getMultipleCoursesProgress(courseIds: string[], userId: string): Promise<Map<string, CourseProgressSummary>> {
    const progressMap = new Map<string, CourseProgressSummary>();
    
    await Promise.all(
      courseIds.map(async (courseId) => {
        try {
          const progress = await this.getCourseProgress(courseId, userId);
          progressMap.set(courseId, progress);
        } catch (error) {
          console.error(`Failed to get progress for course ${courseId}:`, error);
        }
      })
    );

    return progressMap;
  }


  async getUserOverallProgress(userId: string, courseIds: string[]): Promise<{
    totalCourses: number;
    totalExercises: number;
    completedExercises: number;
    averageProgress: number;
  }> {
    const progressMap = await this.getMultipleCoursesProgress(courseIds, userId);
    
    let totalExercises = 0;
    let completedExercises = 0;
    let totalProgress = 0;
    let courseCount = 0;

    progressMap.forEach((progress) => {
      totalExercises += progress.totalExercises;
      completedExercises += progress.completedExercises;
      totalProgress += progress.progressPercent;
      courseCount++;
    });

    return {
      totalCourses: courseCount,
      totalExercises,
      completedExercises,
      averageProgress: courseCount > 0 ? Math.round(totalProgress / courseCount) : 0
    };
  }
}

export const progressService = new ProgressService();
