/**
 * Dependency Injection Container
 * Centralizes dependency creation and injection
 */

// ==================== REPOSITORIES ====================
import { UserRepository } from '../data/repositories/UserRepository';
import { TicketRepository } from '../data/repositories/TicketRepository';
import { TicketCommentRepository } from '../data/repositories/TicketCommentRepository';
import { CourseRepository } from '../data/repositories/CourseRepository';
import { EnrollmentRepository } from '../data/repositories/EnrollmentRepository';

// ==================== USE CASES ====================
// User Use Cases
import { GetUserProfileUseCase } from '../domain/usecases/user/GetUserProfile.usecase';
import { UpdateUserProfileUseCase } from '../domain/usecases/user/UpdateUserProfile.usecase';
import { ResetPasswordUseCase } from '../domain/usecases/user/ResetPassword.usecase';
import { ChangePasswordUseCase } from '../domain/usecases/user/ChangePassword.usecase';
import { UpdateUserAvatarUseCase } from '../domain/usecases/user/UpdateUserAvatar.usecase';
import { UpdateUserBlockStatusUseCase } from '../domain/usecases/user/UpdateUserBlockStatus.usecase';
import { CreateUserByAdminUseCase } from '../domain/usecases/user/CreateUserByAdmin.usecase';
import { UpdateUserRoleUseCase } from '../domain/usecases/user/UpdateUserRole.usecase';
import { DeleteUserUseCase } from '../domain/usecases/user/DeleteUser.usecase';

// Ticket Use Cases
import { CreateTicketUseCase } from '../domain/usecases/ticket/CreateTicket.usecase';
import { GetTicketsUseCase } from '../domain/usecases/ticket/GetTickets.usecase';
import { GetTicketByIdUseCase } from '../domain/usecases/ticket/GetTicketById.usecase';
import { AssignTicketUseCase } from '../domain/usecases/ticket/AssignTicket.usecase';
import { UpdateTicketStatusUseCase } from '../domain/usecases/ticket/UpdateTicketStatus.usecase';

// Course Use Cases
import { CreateCourseUseCase } from '../domain/usecases/course/CreateCourse.usecase';
import { GetCoursesUseCase } from '../domain/usecases/course/GetCourses.usecase';
import { DeleteCourseUseCase } from '../domain/usecases/course/DeleteCourse.usecase';
import { GetCourseByIdUseCase } from '../domain/usecases/course/GetCourseById.usecase';
import { UpdateCourseUseCase } from '../domain/usecases/course/UpdateCourse.usecase';
import { GetPublicCoursesUseCase } from '../domain/usecases/course/GetPublicCourses.usecase';
import { GetPublicCourseByIdUseCase } from '../domain/usecases/course/GetPublicCourseById.usecase';
import { EnrollCourseUseCase } from '../domain/usecases/enrollment/EnrollCourse.usecase';
import { GetEnrollmentsByUserUseCase } from '../domain/usecases/enrollment/GetEnrollmentsByUser.usecase';
import { GetEnrolledCourseIdsUseCase } from '../domain/usecases/enrollment/GetEnrolledCourseIds.usecase';

// ==================== CONTROLLERS ====================
import { UserController } from '../presentation/controllers/UserController';
import { TicketController } from '../presentation/controllers/TicketController';
import { AddressController } from '../presentation/controllers/AddressController';
import { GetUsersByIdsUseCase } from '../domain/usecases/user/GetUsersByIds.usecase';
import { GetUsersUseCase } from '../domain/usecases/user/GetUsers.usecase';
import { AdminUserController } from '../presentation/controllers/AdminUserController';
import { CourseController } from '../presentation/controllers/CourseController';
import { EnrollmentController } from '../presentation/controllers/EnrollmentController';

// ==================== REPOSITORY INSTANCES ====================
const userRepository = new UserRepository();
const ticketRepository = new TicketRepository();
const ticketCommentRepository = new TicketCommentRepository();
const courseRepository = new CourseRepository();
const enrollmentRepository = new EnrollmentRepository();

// ==================== USE CASE INSTANCES ====================
// User Use Cases
const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository);
const changePasswordUseCase = new ChangePasswordUseCase(userRepository);
const updateUserAvatarUseCase = new UpdateUserAvatarUseCase(userRepository);
const getUsersByIdsUseCase = new GetUsersByIdsUseCase(userRepository);
const updateUserBlockStatusUseCase = new UpdateUserBlockStatusUseCase(userRepository);
const createUserByAdminUseCase = new CreateUserByAdminUseCase(userRepository);
const updateUserRoleUseCase = new UpdateUserRoleUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);

// Ticket use-cases
const createTicketUseCase = new CreateTicketUseCase(ticketRepository);
const getTicketsUseCase = new GetTicketsUseCase(ticketRepository);
const getTicketByIdUseCase = new GetTicketByIdUseCase(ticketRepository);
const assignTicketUseCase = new AssignTicketUseCase(ticketRepository);
const updateTicketStatusUseCase = new UpdateTicketStatusUseCase(ticketRepository);

// Course use-cases
const createCourseUseCase = new CreateCourseUseCase(courseRepository);
const getCoursesUseCase = new GetCoursesUseCase(courseRepository);
const deleteCourseUseCase = new DeleteCourseUseCase(courseRepository);
const getCourseByIdUseCase = new GetCourseByIdUseCase(courseRepository);
const updateCourseUseCase = new UpdateCourseUseCase(courseRepository);
const getPublicCoursesUseCase = new GetPublicCoursesUseCase(courseRepository);
const getPublicCourseByIdUseCase = new GetPublicCourseByIdUseCase(courseRepository);
const enrollCourseUseCase = new EnrollCourseUseCase(enrollmentRepository, courseRepository);
const getEnrollmentsByUserUseCase = new GetEnrollmentsByUserUseCase(enrollmentRepository);
const getEnrolledCourseIdsUseCase = new GetEnrolledCourseIdsUseCase(enrollmentRepository);

// ==================== CONTROLLER INSTANCES ====================
export const userController = new UserController(
  getUserProfileUseCase,
  updateUserProfileUseCase,
  resetPasswordUseCase,
  changePasswordUseCase,
  updateUserAvatarUseCase
);

// Admin user list use-case + controller
const getUsersUseCase = new GetUsersUseCase(userRepository);
export const adminUserController = new AdminUserController(
  getUsersUseCase,
  updateUserBlockStatusUseCase,
  createUserByAdminUseCase,
  updateUserRoleUseCase,
  deleteUserUseCase
);

export const addressController = new AddressController();


export const ticketController = new TicketController(
  createTicketUseCase,
  getTicketsUseCase,
  getTicketByIdUseCase,
  ticketCommentRepository,
  ticketRepository,
  assignTicketUseCase,
  updateTicketStatusUseCase
);

export const courseController = new CourseController(
  createCourseUseCase,
  getCoursesUseCase,
  deleteCourseUseCase,
  getCourseByIdUseCase,
  updateCourseUseCase,
  getPublicCoursesUseCase,
  getPublicCourseByIdUseCase,
  getEnrolledCourseIdsUseCase
);

export const enrollmentController = new EnrollmentController(
  enrollCourseUseCase,
  getEnrollmentsByUserUseCase
);

// ==================== EXPORTS FOR REUSE ====================
export const repositories = {
  userRepository,
  ticketRepository
};

export const useCases = {
  // User
  getUserProfileUseCase,
  updateUserProfileUseCase,
  resetPasswordUseCase,
  changePasswordUseCase,
  updateUserAvatarUseCase,
  getUsersByIdsUseCase,
};

// expose ticket use-cases
export const ticketUseCases = {
  createTicketUseCase,
  getTicketsUseCase,
  getTicketByIdUseCase,
  assignTicketUseCase,
  updateTicketStatusUseCase
};

export const courseUseCases = {
  createCourseUseCase,
  getCoursesUseCase,
  deleteCourseUseCase,
  getCourseByIdUseCase, 
  updateCourseUseCase
};