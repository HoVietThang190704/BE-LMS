import { Request, Response } from 'express';
import { CreateCourseUseCase } from '../../domain/usecases/course/CreateCourse.usecase';
import { GetCoursesUseCase } from '../../domain/usecases/course/GetCourses.usecase';
import { DeleteCourseUseCase } from '../../domain/usecases/course/DeleteCourse.usecase';
import { GetCourseByIdUseCase } from '../../domain/usecases/course/GetCourseById.usecase';
import { UpdateCourseUseCase } from '../../domain/usecases/course/UpdateCourse.usecase';
import { GetPublicCoursesUseCase } from '../../domain/usecases/course/GetPublicCourses.usecase';
import { GetPublicCourseByIdUseCase } from '../../domain/usecases/course/GetPublicCourseById.usecase';
import { GetEnrolledCourseIdsUseCase } from '../../domain/usecases/enrollment/GetEnrolledCourseIds.usecase';
import { logger } from '../../shared/utils/logger';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';
import { 
  handleControllerError, 
  requireAuth, 
  sendFailure, 
  sendSuccess 
} from '../../shared/utils/controllerUtils';
import { resolveUserId } from '../../shared/utils/userContext';
import { CourseStatus } from '../../domain/repositories/ICourseRepository';

/**
 * Course Controller
 * Handles HTTP requests for course endpoints
 */
export class CourseController {
  constructor(
    private createCourseUseCase: CreateCourseUseCase,
    private getCoursesUseCase: GetCoursesUseCase,
    private deleteCourseUseCase: DeleteCourseUseCase,
    private getCourseByIdUseCase: GetCourseByIdUseCase,
    private updateCourseUseCase: UpdateCourseUseCase,
    private getPublicCoursesUseCase: GetPublicCoursesUseCase,
    private getPublicCourseByIdUseCase: GetPublicCourseByIdUseCase,
    private getEnrolledCourseIdsUseCase: GetEnrolledCourseIdsUseCase
  ) {}

  /**
   * POST /api/courses
   * Create a new course
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      // 1. Lấy userId từ token (thông qua hàm helper requireAuth)
      const { userId } = requireAuth(req);
      
      const { code, name, description, tags, image, credits, instructor, schedule, room, capacity, syllabus, visibility, requireApproval } = req.body;

      // 2. Gọi Use Case
      const newCourse = await this.createCourseUseCase.execute({
        code,
        name,
        description,
        image,
        tags,
        credits,
        schedule,
        room,
        capacity,
        syllabus,
        ownerId: userId,
        visibility: visibility === 'private' ? 'private' : 'public',
        requireApproval: Boolean(requireApproval),
        invitationCode: req.body.invitationCode,
        instructor: instructor || req.user?.email
      });

      logger.info(`New course created: ${code} by user ${userId}`);

      // 3. Trả về response thành công
      sendSuccess(res, {
        status: HTTP_STATUS.CREATED, // 201
        message: 'Tạo môn học thành công',
        data: newCourse
      });

    } catch (error: any) {
      // Xử lý các lỗi đặc thù (nếu có validation logic trong usecase ném ra)
      if (error.message.includes('exists') || error.code === 11000) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'Mã môn học đã tồn tại'
        });
        return;
      }

      handleControllerError(res, error, 'Lỗi server khi tạo môn học');
    }
  }

  /**
   * GET /api/courses
   * Get list of courses for current teacher
   */
  async getList(req: Request, res: Response): Promise<void> {
    try {
      const { userId, role } = requireAuth(req);
      const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
      const rawStatus = typeof req.query.status === 'string' ? req.query.status : undefined;
      const status = rawStatus === 'active' || rawStatus === 'archived' ? (rawStatus as CourseStatus) : undefined;

      // 1. (+) Lấy page và limit (mặc định là trang 1, 10 dòng)
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // 2. (+) Gọi UseCase với đầy đủ tham số
      const { data, total } = await this.getCoursesUseCase.execute({
        ownerId: userId,
        role,
        keyword,
        status,
        page,
        limit
      });

      // 3. (+) Trả về dữ liệu kèm Meta cho Frontend dễ phân trang
      sendSuccess(res, {
        message: 'Lấy danh sách môn học thành công',
        data: data,
        // Bổ sung object meta
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error: any) {
      handleControllerError(res, error, 'Lỗi server khi lấy danh sách môn học');
    }
  }

  /**
   * DELETE /api/courses/:id
   * Delete a course (Check constraints before deleting)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = requireAuth(req);
      const { id } = req.params;

      await this.deleteCourseUseCase.execute(id, userId);

      logger.info(`Course deleted: ${id} by user ${userId}`);

      sendSuccess(res, {
        message: 'Xóa môn học thành công'
      });

    } catch (error: any) {
      // Xử lý các lỗi business logic cụ thể
      if (error.message === 'Course not found' || error.message === 'Permission denied') {
        sendFailure(res, {
          status: HTTP_STATUS.NOT_FOUND,
          message: 'Không tìm thấy môn học hoặc bạn không có quyền xóa'
        });
        return;
      }

      if (error.message.includes('linked sections')) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'Không thể xóa môn học vì đã có lớp học phần liên kết'
        });
        return;
      }

      handleControllerError(res, error, 'Lỗi server khi xóa môn học');
    }
  }

  /**
   * GET /api/courses/:id
   * Lấy chi tiết môn học
   */
  async getDetail(req: Request, res: Response): Promise<void> {
    try {
      const { userId, role } = requireAuth(req); // Lấy cả role để check quyền
      const { id } = req.params;

      const course = await this.getCourseByIdUseCase.execute(id, userId, role);

      sendSuccess(res, {
        message: 'Lấy thông tin môn học thành công',
        data: course
      });
    } catch (error: any) {
      if (error.message === 'Course not found') {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: 'Không tìm thấy môn học' });
        return;
      }
      if (error.message === 'Permission denied') {
        sendFailure(res, { status: HTTP_STATUS.FORBIDDEN, message: 'Bạn không có quyền truy cập môn học này' });
        return;
      }
      handleControllerError(res, error, 'Lỗi server khi lấy chi tiết môn học');
    }
  }

  /**
   * GET /api/courses/public
   * Lấy danh sách công khai (dành cho student / client)
   */
  async getPublicList(req: Request, res: Response): Promise<void> {
    try {
      const keyword = req.query.keyword as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { data, total } = await this.getPublicCoursesUseCase.execute(keyword, page, limit);

      const userId = await resolveUserId(req);
      const enrolledIds = userId ? new Set(await this.getEnrolledCourseIdsUseCase.execute(userId)) : new Set<string>();
      const enriched = data.map((course) => {
        const { invitationCode, ...safeCourse } = course as any;
        const courseId = course._id || course.code;
        const isEnrolled = enrolledIds.has(String(courseId));
        const tags = Array.from(new Set([...(course.tags || []), ...(isEnrolled ? ['enrolled'] : [])]));
        return { ...safeCourse, isEnrolled, tags };
      });

      sendSuccess(res, {
        message: 'Lấy danh sách khóa học công khai thành công',
        data: enriched,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
      });
    } catch (error: any) {
      handleControllerError(res, error, 'Lỗi server khi lấy danh sách công khai');
    }
  }

  /**
   * GET /api/courses/public/:id
   * Lấy chi tiết khóa học công khai
   */
  async getPublicDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const course = await this.getPublicCourseByIdUseCase.execute(id);
      const userId = await resolveUserId(req);
      const enrolledIds = userId ? new Set(await this.getEnrolledCourseIdsUseCase.execute(userId)) : new Set<string>();
      const { invitationCode, ...safeCourse } = course as any;
      const courseId = course._id || course.code;
      const isEnrolled = enrolledIds.has(String(courseId));
      const tags = Array.from(new Set([...(course.tags || []), ...(isEnrolled ? ['enrolled'] : [])]));

      sendSuccess(res, {
        message: 'Lấy thông tin khóa học thành công',
        data: { ...safeCourse, isEnrolled, tags }
      });
    } catch (error: any) {
      if (error.message === 'Course not found') {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: 'Không tìm thấy khóa học' });
        return;
      }
      handleControllerError(res, error, 'Lỗi server khi lấy chi tiết khóa học');
    }
  }

  /**
   * PUT /api/courses/:id
   * Cập nhật thông tin môn học
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { userId, role } = requireAuth(req);
      const { id } = req.params;
      const updateData = req.body; // Body đã được validate qua middleware schema

      const updatedCourse = await this.updateCourseUseCase.execute(id, userId, role, updateData);

      logger.info(`Course updated: ${id} by user ${userId}`);

      sendSuccess(res, {
        message: 'Cập nhật môn học thành công',
        data: updatedCourse
      });
    } catch (error: any) {
      if (error.message === 'Course not found') {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: 'Không tìm thấy môn học' });
        return;
      }
      if (error.message === 'Permission denied') {
        sendFailure(res, { status: HTTP_STATUS.FORBIDDEN, message: 'Bạn không có quyền sửa môn học này' });
        return;
      }
      handleControllerError(res, error, 'Lỗi server khi cập nhật môn học');
    }
  }
}