import mongoose from 'mongoose';
import QuizExerciseModel from '../models/exercises/QuizExercise';
import PracticeExerciseModel from '../models/exercises/PracticeExercise';
import QuizSubmissionModel from '../models/exercises/QuizSubmission';
import PracticeSubmissionModel from '../models/exercises/PracticeSubmission';
import CourseModel from '../models/courses/Course';
import EnrollmentModel from '../models/Enrollment';
import CourseLessonModel from '../models/CourseLesson';

export interface CourseGrade {
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  quizScore: number | null;      
  practiceScore: number | null;  
  total: number | null;          
  grade: string;                 
}

export interface GradeSummary {
  userId: string;
  totalCredits: number;
  earnedCredits: number;
  gpa: number;
  courses: CourseGrade[];
}

export interface ProgressReport {
  userId: string;
  streakDays: number;
  lessonsCompleted: number;
  exercisesCompleted: string;
  averageScore: number;
  courseProgress: CourseProgressDetail[];
}

export interface CourseProgressDetail {
  courseId: string;
  courseCode: string;
  courseName: string;
  category: 'Trung bình' | 'Tốt' | 'Xuất sắc';
  progressPercent: number;
  lessonsProgress: string;
  exercisesProgress: string;
  studyTime: string;
  currentScore: number;
}

function calculateGrade(score: number | null): string {
  if (score === null) return '-';
  if (score >= 9.0) return 'A+';
  if (score >= 8.5) return 'A';
  if (score >= 8.0) return 'B+';
  if (score >= 7.0) return 'B';
  if (score >= 6.5) return 'C+';
  if (score >= 5.5) return 'C';
  if (score >= 5.0) return 'D+';
  if (score >= 4.0) return 'D';
  return 'F';
}

function scoreToGPA(score: number): number {
  if (score >= 9.0) return 4.0;
  if (score >= 8.5) return 3.7;
  if (score >= 8.0) return 3.5;
  if (score >= 7.0) return 3.0;
  if (score >= 6.5) return 2.5;
  if (score >= 5.5) return 2.0;
  if (score >= 5.0) return 1.5;
  if (score >= 4.0) return 1.0;
  return 0;
}

export class GradeService {
 
  async getUserGrades(userId: string): Promise<GradeSummary> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);


    const enrollments = await EnrollmentModel.find({
      userId: userObjectId,
      status: 'approved'
    }).populate('courseId').lean();

    const courses: CourseGrade[] = [];
    let totalWeightedScore = 0;
    let totalCredits = 0;
    let earnedCredits = 0;

    for (const enrollment of enrollments) {
      const course = enrollment.courseId as any;
      if (!course || !course._id) continue;

      const courseId = course._id.toString();
      const credits = course.credits || 3;

      const quizzes = await QuizExerciseModel.find({ courseId: course._id }).select('_id').lean();
      const quizIds = quizzes.map(q => q._id);

      let quizScore: number | null = null;
      if (quizIds.length > 0) {
        const quizBest = await QuizSubmissionModel.aggregate([
          { $match: { quizId: { $in: quizIds }, studentId: userObjectId } },
          { $sort: { percentage: -1 } },
          { $group: { _id: '$quizId', best: { $first: '$percentage' } } }
        ]);
        const bestPercentages = quizBest.map((b: any) => b.best).filter((v: any) => typeof v === 'number');
        if (bestPercentages.length > 0) {
          const avgBest = bestPercentages.reduce((s: number, v: number) => s + v, 0) / bestPercentages.length;
          quizScore = Math.round(avgBest) / 10; 
        }
      }

      const practices = await PracticeExerciseModel.find({ courseId: course._id }).select('_id').lean();
      const practiceIds = practices.map(p => p._id);

      let practiceScore: number | null = null;
      if (practiceIds.length > 0) {
        const practiceBest = await PracticeSubmissionModel.aggregate([
          { $match: { practiceId: { $in: practiceIds }, studentId: userObjectId } },
          { $sort: { percentage: -1 } },
          { $group: { _id: '$practiceId', best: { $first: '$percentage' } } }
        ]);
        const bestPracticePercent = practiceBest.map((b: any) => b.best).filter((v: any) => typeof v === 'number');
        if (bestPracticePercent.length > 0) {
          const avgBest = bestPracticePercent.reduce((s: number, v: number) => s + v, 0) / bestPracticePercent.length;
          practiceScore = Math.round(avgBest) / 10; 
        }
      }

      let total: number | null = null;
      const quiz = quizScore ?? 0;
      const practice = practiceScore ?? 0;
      const quizWeight = quizIds.length > 0 ? 0.4 : 0;
      const practiceWeight = practiceIds.length > 0 ? 0.6 : 0;
      const totalWeight = quizWeight + practiceWeight;

      if (totalWeight > 0) {
        total = Math.round(((quiz * quizWeight + practice * practiceWeight) / totalWeight) * 10) / 10;
      }

      totalCredits += credits;

      if (total !== null) {
        totalWeightedScore += total * credits;
      }

      const isEarned = total !== null && total >= 5.0;
      if (isEarned) {
        earnedCredits += credits;
      }

      courses.push({
        courseId,
        courseCode: course.code || 'N/A',
        courseName: course.name || 'Untitled Course',
        credits,
        quizScore,
        practiceScore,
        total,
        grade: calculateGrade(total)
      });
    }

    const gpa = totalCredits > 0 
      ? Math.round(scoreToGPA(totalWeightedScore / totalCredits) * 100) / 100
      : 0;

    return {
      userId,
      totalCredits,
      earnedCredits,
      gpa,
      courses
    };
  }

  async getUserProgressReport(userId: string): Promise<ProgressReport> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const enrollments = await EnrollmentModel.find({
      userId: userObjectId,
      status: 'approved'
    }).populate('courseId').lean();

    const courseProgress: CourseProgressDetail[] = [];
    let totalExercisesCompleted = 0;
    let totalExercises = 0;
    let totalScoreSum = 0;
    let scoreCount = 0;

    for (const enrollment of enrollments) {
      const course = enrollment.courseId as any;
      if (!course || !course._id) continue;

      const courseId = course._id.toString();

      const totalLessons = await CourseLessonModel.countDocuments({ 
        courseId: course._id,
        isPublished: true 
      });
      const lessonsRead = 0;

      const quizzes = await QuizExerciseModel.find({ courseId: course._id }).select('_id').lean();
      const quizIds = quizzes.map(q => q._id);
      const completedQuizzes = await QuizSubmissionModel.distinct('quizId', {
        quizId: { $in: quizIds },
        studentId: userObjectId
      });


      const practices = await PracticeExerciseModel.find({ courseId: course._id }).select('_id').lean();
      const practiceIds = practices.map(p => p._id);
      const completedPractices = await PracticeSubmissionModel.distinct('practiceId', {
        practiceId: { $in: practiceIds },
        studentId: userObjectId
      });

      const courseExercises = quizIds.length + practiceIds.length;
      const courseCompletedExercises = completedQuizzes.length + completedPractices.length;

      totalExercises += courseExercises;
      totalExercisesCompleted += courseCompletedExercises;

      const quizBest = quizIds.length > 0 ? await QuizSubmissionModel.aggregate([
        { $match: { quizId: { $in: quizIds }, studentId: userObjectId } },
        { $sort: { percentage: -1 } },
        { $group: { _id: '$quizId', best: { $first: '$percentage' } } }
      ]) : [];

      const practiceBest = practiceIds.length > 0 ? await PracticeSubmissionModel.aggregate([
        { $match: { practiceId: { $in: practiceIds }, studentId: userObjectId } },
        { $sort: { percentage: -1 } },
        { $group: { _id: '$practiceId', best: { $first: '$percentage' } } }
      ]) : [];

      const quizBestPercent = quizBest.map((b: any) => b.best).filter((v: any) => typeof v === 'number');
      const practiceBestPercent = practiceBest.map((b: any) => b.best).filter((v: any) => typeof v === 'number');

      const quizAvgPercent = quizBestPercent.length > 0
        ? quizBestPercent.reduce((sum: number, v: number) => sum + v, 0) / quizBestPercent.length
        : null;

      const practiceAvgPercent = practiceBestPercent.length > 0
        ? practiceBestPercent.reduce((sum: number, v: number) => sum + v, 0) / practiceBestPercent.length
        : null;

      const quizWeight = quizIds.length > 0 ? 0.4 : 0;
      const practiceWeight = practiceIds.length > 0 ? 0.6 : 0;
      const totalWeight = quizWeight + practiceWeight;

      let weightedPercent = 0;
      if (totalWeight > 0) {
        const quizPercent = quizAvgPercent ?? 0;
        const practicePercent = practiceAvgPercent ?? 0;
        weightedPercent = (quizPercent * quizWeight + practicePercent * practiceWeight) / totalWeight;
        totalScoreSum += weightedPercent;
        scoreCount++;
      }

      const progressPercent = courseExercises > 0 
        ? Math.round((courseCompletedExercises / courseExercises) * 100) 
        : 0;

      let category: 'Trung bình' | 'Tốt' | 'Xuất sắc' = 'Trung bình';
      if (weightedPercent >= 80) category = 'Xuất sắc';
      else if (weightedPercent >= 60) category = 'Tốt';

      const estimatedMinutes = courseCompletedExercises * 10;
      const studyHours = Math.floor(estimatedMinutes / 60);
      const remainingMinutes = estimatedMinutes % 60;

      courseProgress.push({
        courseId,
        courseCode: course.code || 'N/A',
        courseName: course.name || 'Untitled Course',
        category,
        progressPercent,
        lessonsProgress: `0/${totalLessons}`,
        exercisesProgress: `${courseCompletedExercises}/${courseExercises}`,
        studyTime: `${studyHours}h ${remainingMinutes}m`,
        currentScore: Math.round(weightedPercent) / 10
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentQuizSubmissions = await QuizSubmissionModel.find({
      studentId: userObjectId,
      submittedAt: { $gte: thirtyDaysAgo }
    }).select('submittedAt').lean();
    
    const recentPracticeSubmissions = await PracticeSubmissionModel.find({
      studentId: userObjectId,
      submittedAt: { $gte: thirtyDaysAgo }
    }).select('submittedAt').lean();
    
    const activeDays = new Set<string>();
    [...recentQuizSubmissions, ...recentPracticeSubmissions].forEach((sub: any) => {
      if (sub.submittedAt) {
        const date = new Date(sub.submittedAt);
        activeDays.add(date.toISOString().split('T')[0]);
      }
    });
    
    let streakDays = 0;
    const checkDate = new Date(today);
    
    if (!activeDays.has(checkDate.toISOString().split('T')[0])) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (activeDays.has(checkDate.toISOString().split('T')[0])) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
      userId,
      streakDays,
      lessonsCompleted: 0, 
      exercisesCompleted: `${totalExercisesCompleted}/${totalExercises}`,
      averageScore: scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) / 10 : 0,
      courseProgress
    };
  }
}

export const gradeService = new GradeService();
