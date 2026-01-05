import SectionModel, { ISection, IScheduleItem } from '../../models/Section';
import { Notification, INotification } from '../../models/Notification';
import { Ticket, ITicket } from '../../models/Ticket';
import { User } from '../../models/users/User';
import { CourseRepository } from '../../data/repositories/CourseRepository';
import { GetPublicCoursesUseCase } from '../../domain/usecases/course/GetPublicCourses.usecase';
import { ICourse } from '../../domain/entities/Course.entity';
import { EnrollmentRepository } from '../../data/repositories/EnrollmentRepository';
import { GetEnrollmentsByUserUseCase } from '../../domain/usecases/enrollment/GetEnrollmentsByUser.usecase';
import { progressService, CourseProgressSummary } from '../ProgressService';
import PracticeExerciseModel from '../../models/exercises/PracticeExercise';
import QuizExerciseModel from '../../models/exercises/QuizExercise';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_CLASS_LIMIT = 4;
const DEFAULT_ASSIGNMENT_LIMIT = 4;
const DEFAULT_NOTIFICATION_LIMIT = 4;
const DEFAULT_PUBLIC_COURSE_LIMIT = 6;
const DEFAULT_MONITORING_LIMIT = 12;

const courseRepository = new CourseRepository();
const getPublicCoursesUseCase = new GetPublicCoursesUseCase(courseRepository);
const enrollmentRepository = new EnrollmentRepository();
const getEnrollmentsByUserUseCase = new GetEnrollmentsByUserUseCase(enrollmentRepository);

const PROGRESS_BY_STATUS: Record<string, number> = {
  planned: 15,
  ongoing: 55,
  completed: 100,
  cancelled: 0,
};

const PENDING_TICKET_STATUSES = ['open', 'in_progress', 'on_hold'];

function formatSchedule(schedule?: IScheduleItem[]): { label: string; room: string; lessonCount: number } {
  if (!schedule || schedule.length === 0) {
    return { label: 'TBD', room: 'TBD', lessonCount: 0 };
  }
  const first = schedule[0];
  const dayName = DAY_LABELS[first.dayOfWeek] || `Day ${first.dayOfWeek}`;
  const start = first.startTime || '??';
  const end = first.endTime || '??';
  return {
    label: `${dayName} ${start} - ${end}`,
    room: first.room || 'TBD',
    lessonCount: schedule.length,
  };
}

function toAssignmentStatus(status: string): 'pending' | 'in-progress' | 'completed' {
  switch (status) {
    case 'in_progress':
      return 'in-progress';
    case 'resolved':
    case 'closed':
    case 'completed':
      return 'completed';
    default:
      return 'pending';
  }
}

export type HomeClassSummary = {
  id: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  progress: number;
  schedule: string;
  room: string;
  lessonProgress: string;
};

export type HomeAssignmentSummary = {
  id: string;
  title: string;
  courseCode: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
};

export type HomeNotificationSummary = {
  id: string;
  title: string;
  description: string;
  time: string;
};

export type HomeStatsPayload = {
  enrolledCourses: number;
  pendingAssignments: number;
  averageGrade: string;
  learningProgress: number;
};

export type HomeUserProfile = {
  name: string;
};

export type HomeCourseSummary = {
  id: string;
  code: string;
  name: string;
  description?: string;
  tags?: string[];
  status?: 'active' | 'archived';
  image?: string;
  instructor: string;
  schedule: string;
  room: string;
  credits: number;
  enrolled: number;
  capacity: number;
  isEnrolled?: boolean;
  startDate?: string;
  endDate?: string;
  isExpired?: boolean;
};

export type UpcomingExerciseSummary = {
  id: string;
  type: 'practice' | 'quiz';
  title: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  endDate: string;
  daysRemaining: number;
  isExpired: boolean;
};

export type HomeDashboardPayload = {
  user: HomeUserProfile;
  stats: HomeStatsPayload;
  classes: HomeClassSummary[];
  assignments: HomeAssignmentSummary[];
  notifications: HomeNotificationSummary[];
  courses: HomeCourseSummary[];
};

export type HomeClassListPayload = {
  classes: HomeClassSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export class HomeService {
  private mapSection(section: ISection & { courseId?: any; teacherId?: any }): HomeClassSummary {
    const { courseId, teacherId, status, schedule, name } = section;
    const courseCode = courseId?.code || (name ? name.slice(0, 6).toUpperCase() : 'CLASS');
    const courseName = courseId?.name || name || 'Untitled class';
    const instructor = teacherId?.fullName || teacherId?.email || 'TBD';
    const { label, room, lessonCount } = formatSchedule(schedule);
    const progress = typeof status === 'string' ? PROGRESS_BY_STATUS[status] ?? 40 : 40;
    const totalLessons = Math.max(lessonCount || 12, 12);
    const completedLessons = Math.max(1, Math.round((progress / 100) * totalLessons));

    return {
      id: String(section._id),
      courseCode,
      courseName,
      instructor,
      progress,
      schedule: label,
      room,
      lessonProgress: `${completedLessons}/${totalLessons}`,
    };
  }

  private mapTicket(ticket: ITicket): HomeAssignmentSummary {
    return {
      id: String(ticket._id),
      title: ticket.title,
      courseCode: ticket.type ? ticket.type.toUpperCase() : 'TASK',
      deadline: ticket.createdAt ? ticket.createdAt.toISOString() : new Date().toISOString(),
      status: toAssignmentStatus(ticket.status),
    };
  }

  private mapNotification(notification: INotification): HomeNotificationSummary {
    return {
      id: String(notification._id),
      title: notification.title,
      description: notification.message,
      time: notification.createdAt ? notification.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  private deriveProgressFromCourse(course: Partial<ICourse>): number {
    const seed = (course.name || course.code || '').length;
    const base = (seed * 7) % 100;
    return Math.min(90, Math.max(25, base));
  }

  private mapEnrolledCourseToClass(course: ICourse, progressData?: CourseProgressSummary): HomeClassSummary {
    // Sử dụng tiến độ thực từ progressService nếu có, nếu không dùng giá trị mặc định
    const progress = progressData?.progressPercent ?? 0;
    const totalExercises = progressData?.totalExercises ?? 0;
    const completedExercises = progressData?.completedExercises ?? 0;
    
    return {
      id: String(course._id || course.code || course.name),
      courseCode: course.code,
      courseName: course.name,
      instructor: course.instructor || '',
      progress,
      schedule: course.schedule || '',
      room: course.room || '',
      lessonProgress: `${completedExercises}/${totalExercises}`,
    };
  }

  private mapCourse(course: ICourse, isEnrolled = false): HomeCourseSummary {
    const id = course._id?.toString() || course.code || '';
    const now = new Date();
    const isExpired = course.endDate ? new Date(course.endDate) < now : false;
    
    return {
      id: String(id),
      code: course.code,
      name: course.name,
      description: course.description,
      tags: isEnrolled ? Array.from(new Set([...(course.tags || []), ''])) : course.tags,
      status: course.status,
      image: course.image,
      instructor: course.instructor || 'TBD',
      schedule: course.schedule || 'TBD',
      room: course.room || 'TBD',
      credits: course.credits ?? 3,
      enrolled: course.enrolled ?? 0,
      capacity: course.capacity ?? 60,
      isEnrolled,
      startDate: course.startDate?.toISOString?.() || course.startDate as unknown as string,
      endDate: course.endDate?.toISOString?.() || course.endDate as unknown as string,
      isExpired,
    };
  }

  async getDashboard(userId?: string | null): Promise<HomeDashboardPayload> {
    const userProfilePromise = userId
      ? User.findById(userId).lean()
      : User.findOne().sort({ createdAt: 1 }).lean();

    const [sections, totalSections, completedSections, notifications, userRecord, enrollments] = await Promise.all([
      SectionModel.find()
        .sort({ startDate: -1 })
        .limit(6)
        .populate('courseId', 'name code')
        .populate('teacherId', 'fullName email')
        .lean(),
      SectionModel.countDocuments(),
      SectionModel.countDocuments({ status: 'completed' }),
      Notification.find()
        .sort({ createdAt: -1 })
        .limit(DEFAULT_NOTIFICATION_LIMIT)
        .lean(),
      userProfilePromise,
      userId ? getEnrollmentsByUserUseCase.execute(userId) : [],
    ]);

    const sectionDocs = (sections as unknown as Array<ISection & { courseId?: any; teacherId?: any }>) ?? [];
    const notificationDocs = Array.isArray(notifications) ? (notifications as unknown as INotification[]) : [];

    const enrolledCourseIds = new Set(
      (enrollments as any[]).map((item) => {
        const course = (item as any).course || {};
        return course._id?.toString?.() || course.id || (item as any).courseId;
      }).filter(Boolean)
    );

    // Lấy tiến độ thực của từng course đã đăng ký
    let progressMap = new Map<string, CourseProgressSummary>();
    if (userId && enrolledCourseIds.size > 0) {
      try {
        progressMap = await progressService.getMultipleCoursesProgress(
          Array.from(enrolledCourseIds) as string[],
          userId
        );
      } catch (error) {
        console.warn('[HomeService] Failed to get progress for courses:', error);
      }
    }

    const enrolledClasses = (enrollments as any[]) 
      .map((item) => {
        const course = (item as any).course;
        if (!course) return null;
        const courseId = course._id?.toString?.() || course.id || (item as any).courseId;
        const progressData = progressMap.get(String(courseId));
        return this.mapEnrolledCourseToClass(course as ICourse, progressData);
      })
      .filter(Boolean) as HomeClassSummary[];

    const classes = enrolledClasses.length > 0
      ? enrolledClasses
      : sectionDocs.slice(0, DEFAULT_CLASS_LIMIT).map((section) => this.mapSection(section));

    // Lấy bài tập sắp hết hạn từ các khóa học đã đăng ký của user
    const upcomingExercises = await this.getUpcomingDeadlineExercises(userId || undefined);
    const assignmentSummaries: HomeAssignmentSummary[] = upcomingExercises.map((ex) => ({
      id: ex.id,
      title: ex.title,
      courseCode: ex.courseCode,
      deadline: ex.endDate,
      status: 'pending' as const
    }));

    const notificationSummaries = notificationDocs.map((notification) => this.mapNotification(notification));

    const { data: courseDocs } = await getPublicCoursesUseCase.execute(undefined, 1, DEFAULT_PUBLIC_COURSE_LIMIT);
    const publicCourses = (courseDocs || []).map((course) => {
      const courseId = course._id || course.code;
      const isEnrolled = enrolledCourseIds.has(String(courseId));
      return this.mapCourse(course, isEnrolled);
    });

    const learningProgress = classes.length > 0
      ? Math.round(classes.reduce((sum, c) => sum + (c.progress || 0), 0) / classes.length)
      : totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

    const averageGradeValue = learningProgress > 0 ? Math.min(100, Math.max(60, 60 + Math.round((learningProgress / 100) * 40))) : 0;

    return {
      user: {
        name: userRecord?.fullName || userRecord?.email || 'Học viên'
      },
      stats: {
        enrolledCourses: enrolledCourseIds.size || totalSections,
        pendingAssignments: assignmentSummaries.length,
        averageGrade: String(averageGradeValue),
        learningProgress,
      },
      classes,
      assignments: assignmentSummaries,
      notifications: notificationSummaries,
      courses: publicCourses,
    };
  }

  async getMonitoringClasses(options?: { keyword?: string; page?: number; limit?: number }): Promise<HomeClassListPayload> {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(50, Math.max(1, options?.limit ?? DEFAULT_MONITORING_LIMIT));
    const keyword = options?.keyword?.trim() || undefined;

    const { data: courseDocs = [], total } = await getPublicCoursesUseCase.execute(keyword, page, limit);

    const classes = courseDocs.map((course) => this.mapEnrolledCourseToClass(course));

    return {
      classes,
      pagination: {
        page,
        limit,
        total,
      },
    };
  }


  async getUpcomingDeadlineExercises(userId?: string, daysAhead = 7): Promise<UpcomingExerciseSummary[]> {
    if (!userId) {
      return [];
    }

    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const enrollments = await getEnrollmentsByUserUseCase.execute(userId);
    const enrolledCourseIds = (enrollments as any[])
      .map((item) => {
        const course = (item as any).course || {};
        return course._id?.toString?.() || course.id || (item as any).courseId;
      })
      .filter(Boolean);

    if (enrolledCourseIds.length === 0) {
      return [];
    }

    const [practiceExercises, quizExercises] = await Promise.all([
      PracticeExerciseModel.find({
        courseId: { $in: enrolledCourseIds },
        endDate: { $gte: now, $lte: futureDate }
      }).populate('courseId', 'name code').sort({ endDate: 1 }).limit(10).lean(),
      QuizExerciseModel.find({
        courseId: { $in: enrolledCourseIds },
        endDate: { $gte: now, $lte: futureDate }
      }).populate('courseId', 'name code').sort({ endDate: 1 }).limit(10).lean()
    ]);

    const exercises: UpcomingExerciseSummary[] = [];

    for (const practice of practiceExercises) {
      const course = practice.courseId as any;
      const endDate = practice.endDate as Date;
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      exercises.push({
        id: String(practice._id),
        type: 'practice',
        title: practice.title,
        courseId: course?._id?.toString() || '',
        courseName: course?.name || 'Unknown',
        courseCode: course?.code || 'N/A',
        endDate: endDate.toISOString(),
        daysRemaining,
        isExpired: false
      });
    }

    for (const quiz of quizExercises) {
      const course = quiz.courseId as any;
      const endDate = quiz.endDate as Date;
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      exercises.push({
        id: String(quiz._id),
        type: 'quiz',
        title: quiz.title,
        courseId: course?._id?.toString() || '',
        courseName: course?.name || 'Unknown',
        courseCode: course?.code || 'N/A',
        endDate: endDate.toISOString(),
        daysRemaining,
        isExpired: false
      });
    }

    exercises.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

    return exercises.slice(0, 10);
  }

  isCourseActive(course: ICourse): { isActive: boolean; message?: string } {
    const now = new Date();
    
    if (course.status === 'archived') {
      return { isActive: false, message: 'Khóa học đã được lưu trữ' };
    }

    if (course.endDate && new Date(course.endDate) < now) {
      return { isActive: false, message: 'Khóa học đã kết thúc' };
    }

    if (course.startDate && new Date(course.startDate) > now) {
      return { isActive: false, message: 'Khóa học chưa bắt đầu' };
    }

    return { isActive: true };
  }
}

export const homeService = new HomeService();
