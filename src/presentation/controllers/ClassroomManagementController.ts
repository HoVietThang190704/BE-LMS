import { Request, Response } from 'express';
import mongoose from 'mongoose';
import EnrollmentModel from '../../models/Enrollment';
import { User } from '../../models/users/User';
import CourseModel from '../../models/courses/Course';
import QuizExerciseModel from '../../models/exercises/QuizExercise';
import PracticeExerciseModel from '../../models/exercises/PracticeExercise';
import QuizSubmissionModel from '../../models/exercises/QuizSubmission';
import PracticeSubmissionModel from '../../models/exercises/PracticeSubmission';
import { sendSuccess, sendFailure, handleControllerError } from '../../shared/utils/controllerUtils';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';
import { resolveUserId } from '../../shared/utils/userContext';

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

export class ClassroomManagementController {

  static async getStudentsByCourse(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const currentUserId = await resolveUserId(req);

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: 'Invalid courseId' });
        return;
      }

      const course = await CourseModel.findById(courseId).lean();
      if (!course) {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: 'Không tìm thấy khóa học' });
        return;
      }

      const isOwner = course.ownerId?.toString() === currentUserId;
      const user = await User.findById(currentUserId).lean();
      const isAdmin = user?.role === 'admin';

      if (!isOwner && !isAdmin) {
        sendFailure(res, { status: HTTP_STATUS.FORBIDDEN, message: 'Bạn không có quyền xem danh sách sinh viên' });
        return;
      }

      const enrollments = await EnrollmentModel.find({ courseId })
        .populate('userId', 'email fullName profile role isActive')
        .sort({ enrolledAt: -1 })
        .lean();

      const students = enrollments.map((enrollment: any) => ({
        enrollmentId: enrollment._id?.toString(),
        userId: enrollment.userId?._id?.toString() || enrollment.userId?.toString(),
        email: enrollment.userId?.email || 'N/A',
        fullName: enrollment.userId?.fullName || 'N/A',
        avatarUrl: enrollment.userId?.profile?.avatarUrl || null,
        role: enrollment.userId?.role || 'student',
        isActive: enrollment.userId?.isActive ?? true,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt
      }));

      sendSuccess(res, {
        data: students,
        meta: {
          total: students.length,
          courseId,
          courseName: course.name,
          courseCode: course.code
        }
      });
    } catch (error) {
      handleControllerError(res, error, 'Không thể lấy danh sách sinh viên');
    }
  }

  static async getStudentGradesByCourse(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const currentUserId = await resolveUserId(req);

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: 'Invalid courseId' });
        return;
      }

      const course = await CourseModel.findById(courseId).lean();
      if (!course) {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: 'Không tìm thấy khóa học' });
        return;
      }

      const isOwner = course.ownerId?.toString() === currentUserId;
      const user = await User.findById(currentUserId).lean();
      const isAdmin = user?.role === 'admin';

      if (!isOwner && !isAdmin) {
        sendFailure(res, { status: HTTP_STATUS.FORBIDDEN, message: 'Bạn không có quyền xem bảng điểm' });
        return;
      }

      const enrollments = await EnrollmentModel.find({ 
        courseId, 
        status: 'approved' 
      })
        .populate('userId', 'email fullName profile')
        .lean();

      const quizzes = await QuizExerciseModel.find({ courseId }).select('_id title').lean();
      const practices = await PracticeExerciseModel.find({ courseId }).select('_id title').lean();

      const quizIds = quizzes.map(q => q._id);
      const practiceIds = practices.map(p => p._id);

      const studentGrades = [];

      for (const enrollment of enrollments) {
        const student = enrollment.userId as any;
        if (!student || !student._id) continue;

        const studentId = student._id;

        let quizScore: number | null = null;
        if (quizIds.length > 0) {
          const quizBest = await QuizSubmissionModel.aggregate([
            { $match: { quizId: { $in: quizIds }, studentId } },
            { $sort: { percentage: -1 } },
            { $group: { _id: '$quizId', best: { $first: '$percentage' } } }
          ]);
          const bestPercentages = quizBest.map((b: any) => b.best).filter((v: any) => typeof v === 'number');
          if (bestPercentages.length > 0) {
            const avgBest = bestPercentages.reduce((s: number, v: number) => s + v, 0) / bestPercentages.length;
            quizScore = Math.round(avgBest) / 10;
          }
        }

        let practiceScore: number | null = null;
        if (practiceIds.length > 0) {
          const practiceBest = await PracticeSubmissionModel.aggregate([
            { $match: { practiceId: { $in: practiceIds }, studentId } },
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

        studentGrades.push({
          userId: studentId.toString(),
          email: student.email,
          fullName: student.fullName || 'N/A',
          avatarUrl: student.profile?.avatarUrl || null,
          quizScore,
          practiceScore,
          total,
          grade: calculateGrade(total),
          enrolledAt: enrollment.enrolledAt
        });
      }

      sendSuccess(res, {
        data: studentGrades,
        meta: {
          total: studentGrades.length,
          courseId,
          courseName: course.name,
          courseCode: course.code,
          totalQuizzes: quizzes.length,
          totalPractices: practices.length
        }
      });
    } catch (error) {
      handleControllerError(res, error, 'Không thể lấy bảng điểm sinh viên');
    }
  }


  static async addStudentByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { email } = req.body;
      const currentUserId = await resolveUserId(req);

      if (!email) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: 'Email là bắt buộc' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: 'Invalid courseId' });
        return;
      }

      const course = await CourseModel.findById(courseId).lean();
      if (!course) {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: 'Không tìm thấy khóa học' });
        return;
      }

      const isOwner = course.ownerId?.toString() === currentUserId;
      const currentUser = await User.findById(currentUserId).lean();
      const isAdmin = currentUser?.role === 'admin';

      if (!isOwner && !isAdmin) {
        sendFailure(res, { status: HTTP_STATUS.FORBIDDEN, message: 'Bạn không có quyền thêm sinh viên' });
        return;
      }

      const student = await User.findOne({ email: email.toLowerCase().trim() }).lean();
      if (!student) {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: `Không tìm thấy người dùng với email: ${email}` });
        return;
      }

      const existingEnrollment = await EnrollmentModel.findOne({
        userId: student._id,
        courseId
      }).lean();

      if (existingEnrollment) {
        sendFailure(res, { status: HTTP_STATUS.CONFLICT, message: `Người dùng ${email} đã đăng ký khóa học này` });
        return;
      }

      const enrollment = await EnrollmentModel.create({
        userId: student._id,
        courseId,
        status: 'approved',
        enrolledAt: new Date()
      });

      await CourseModel.findByIdAndUpdate(courseId, { $inc: { enrolled: 1 } });

      sendSuccess(res, {
        status: HTTP_STATUS.CREATED,
        message: `Đã thêm ${student.fullName || email} vào khóa học`,
        data: {
          enrollmentId: enrollment._id?.toString(),
          userId: student._id.toString(),
          email: student.email,
          fullName: student.fullName,
          status: 'approved'
        }
      });
    } catch (error) {
      handleControllerError(res, error, 'Không thể thêm sinh viên');
    }
  }


  static async addStudentsBulk(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { emails } = req.body;
      const currentUserId = await resolveUserId(req);

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: 'Danh sách email là bắt buộc' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: 'Invalid courseId' });
        return;
      }

      const course = await CourseModel.findById(courseId).lean();
      if (!course) {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: 'Không tìm thấy khóa học' });
        return;
      }

      const isOwner = course.ownerId?.toString() === currentUserId;
      const currentUser = await User.findById(currentUserId).lean();
      const isAdmin = currentUser?.role === 'admin';

      if (!isOwner && !isAdmin) {
        sendFailure(res, { status: HTTP_STATUS.FORBIDDEN, message: 'Bạn không có quyền thêm sinh viên' });
        return;
      }

      const results = {
        success: [] as string[],
        notFound: [] as string[],
        alreadyEnrolled: [] as string[],
        failed: [] as string[]
      };

      for (const rawEmail of emails) {
        const email = rawEmail?.toString().toLowerCase().trim();
        if (!email) continue;

        try {
          const student = await User.findOne({ email }).lean();
          if (!student) {
            results.notFound.push(email);
            continue;
          }

          const existing = await EnrollmentModel.findOne({
            userId: student._id,
            courseId
          }).lean();

          if (existing) {
            results.alreadyEnrolled.push(email);
            continue;
          }

          await EnrollmentModel.create({
            userId: student._id,
            courseId,
            status: 'approved',
            enrolledAt: new Date()
          });

          results.success.push(email);
        } catch (e) {
          results.failed.push(email);
        }
      }

      if (results.success.length > 0) {
        await CourseModel.findByIdAndUpdate(courseId, { 
          $inc: { enrolled: results.success.length } 
        });
      }

      sendSuccess(res, {
        message: `Đã thêm ${results.success.length}/${emails.length} sinh viên`,
        data: results
      });
    } catch (error) {
      handleControllerError(res, error, 'Không thể thêm sinh viên');
    }
  }


  static async removeStudent(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, userId } = req.params;
      const currentUserId = await resolveUserId(req);

      if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(userId)) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: 'Invalid courseId or userId' });
        return;
      }

      const course = await CourseModel.findById(courseId).lean();
      if (!course) {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: 'Không tìm thấy khóa học' });
        return;
      }

      const isOwner = course.ownerId?.toString() === currentUserId;
      const currentUser = await User.findById(currentUserId).lean();
      const isAdmin = currentUser?.role === 'admin';

      if (!isOwner && !isAdmin) {
        sendFailure(res, { status: HTTP_STATUS.FORBIDDEN, message: 'Bạn không có quyền xóa sinh viên' });
        return;
      }

      const result = await EnrollmentModel.findOneAndDelete({
        userId,
        courseId
      });

      if (!result) {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: 'Không tìm thấy enrollment' });
        return;
      }

      await CourseModel.findByIdAndUpdate(courseId, { $inc: { enrolled: -1 } });

      sendSuccess(res, {
        message: 'Đã xóa sinh viên khỏi khóa học'
      });
    } catch (error) {
      handleControllerError(res, error, 'Không thể xóa sinh viên');
    }
  }
}
