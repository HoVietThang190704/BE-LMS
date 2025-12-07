/**
 * Dependency Injection Container
 * Centralizes dependency creation and injection
 */

// ==================== REPOSITORIES ====================
import { UserRepository } from '../data/repositories/UserRepository';
import { TicketRepository } from '../data/repositories/TicketRepository';
import { TicketCommentRepository } from '../data/repositories/TicketCommentRepository';

// ==================== USE CASES ====================
// User Use Cases
import { GetUserProfileUseCase } from '../domain/usecases/user/GetUserProfile.usecase';
import { UpdateUserProfileUseCase } from '../domain/usecases/user/UpdateUserProfile.usecase';
import { ResetPasswordUseCase } from '../domain/usecases/user/ResetPassword.usecase';
import { ChangePasswordUseCase } from '../domain/usecases/user/ChangePassword.usecase';
import { UpdateUserAvatarUseCase } from '../domain/usecases/user/UpdateUserAvatar.usecase';

// Ticket Use Cases
import { CreateTicketUseCase } from '../domain/usecases/ticket/CreateTicket.usecase';
import { GetTicketsUseCase } from '../domain/usecases/ticket/GetTickets.usecase';
import { GetTicketByIdUseCase } from '../domain/usecases/ticket/GetTicketById.usecase';
import { AssignTicketUseCase } from '../domain/usecases/ticket/AssignTicket.usecase';
import { UpdateTicketStatusUseCase } from '../domain/usecases/ticket/UpdateTicketStatus.usecase';

// ==================== CONTROLLERS ====================
import { UserController } from '../presentation/controllers/UserController';
import { TicketController } from '../presentation/controllers/TicketController';
import { AddressController } from '../presentation/controllers/AddressController';
import { GetUsersByIdsUseCase } from '../domain/usecases/user/GetUsersByIds.usecase';
import { GetUsersUseCase } from '../domain/usecases/user/GetUsers.usecase';
import { AdminUserController } from '../presentation/controllers/AdminUserController';

// ==================== REPOSITORY INSTANCES ====================
const userRepository = new UserRepository();
const ticketRepository = new TicketRepository();
const ticketCommentRepository = new TicketCommentRepository();

// ==================== USE CASE INSTANCES ====================
// User Use Cases
const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository);
const changePasswordUseCase = new ChangePasswordUseCase(userRepository);
const updateUserAvatarUseCase = new UpdateUserAvatarUseCase(userRepository);
const getUsersByIdsUseCase = new GetUsersByIdsUseCase(userRepository)

// Ticket use-cases
const createTicketUseCase = new CreateTicketUseCase(ticketRepository);
const getTicketsUseCase = new GetTicketsUseCase(ticketRepository);
const getTicketByIdUseCase = new GetTicketByIdUseCase(ticketRepository);
const assignTicketUseCase = new AssignTicketUseCase(ticketRepository);
const updateTicketStatusUseCase = new UpdateTicketStatusUseCase(ticketRepository);

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
export const adminUserController = new AdminUserController(getUsersUseCase);

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
