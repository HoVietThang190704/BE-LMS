import { Request, Response } from 'express';
import { CreateTicketUseCase } from '../../domain/usecases/ticket/CreateTicket.usecase';
import { GetTicketsUseCase } from '../../domain/usecases/ticket/GetTickets.usecase';
import { GetTicketByIdUseCase } from '../../domain/usecases/ticket/GetTicketById.usecase';
import { AssignTicketUseCase } from '../../domain/usecases/ticket/AssignTicket.usecase';
import { UpdateTicketStatusUseCase } from '../../domain/usecases/ticket/UpdateTicketStatus.usecase';
import { TicketCommentRepository } from '../../data/repositories/TicketCommentRepository';
import { TicketRepository } from '../../data/repositories/TicketRepository';
import { TicketMapper } from '../dto/ticket/Ticket.dto';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';
import { handleControllerError, requireAuth, sendFailure, sendSuccess } from '../../shared/utils/controllerUtils';

export class TicketController {
  constructor(
    private createTicketUseCase: CreateTicketUseCase,
    private getTicketsUseCase: GetTicketsUseCase,
    private getTicketByIdUseCase: GetTicketByIdUseCase,
    private ticketCommentRepository?: TicketCommentRepository,
    private ticketRepository?: TicketRepository,
    private assignTicketUseCase?: AssignTicketUseCase,
    private updateTicketStatusUseCase?: UpdateTicketStatusUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as any;
      const { userId: createdBy } = requireAuth(req);
      const ticket = await this.createTicketUseCase.execute({ ...body, createdBy });
      sendSuccess(res, {
        status: HTTP_STATUS.CREATED,
        message: 'Ticket created',
        data: TicketMapper.toDTO(ticket)
      });
    } catch (error: any) {
      handleControllerError(res, error, 'Lỗi khi tạo ticket');
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(String(req.query.limit || '50'), 10);
      const offset = parseInt(String(req.query.offset || '0'), 10);
      const filter: any = {};
      // if user not admin, show only own tickets
      const userRole = req.user?.role;
      if (userRole !== 'admin') {
        filter.created_by = req.user?.userId;
      } else {
        // admin filters
        if (req.query.status) filter.status = String(req.query.status);
        if (req.query.assignedTo) filter.assigned_to = String(req.query.assignedTo);
      }

      const docs = await this.getTicketsUseCase.execute(filter, limit, offset);
      const data = docs.map((d: any) => TicketMapper.toDTO(d));
      sendSuccess(res, { data });
    } catch (error: any) {
      handleControllerError(res, error, 'Lỗi khi lấy danh sách ticket');
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await this.getTicketByIdUseCase.execute(id);
      if (!doc) {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: 'Không tìm thấy ticket' });
        return;
      }
      sendSuccess(res, { data: TicketMapper.toDTO(doc) });
    } catch (error: any) {
      handleControllerError(res, error, 'Lỗi khi lấy ticket');
    }
  }

  async addComment(req: Request, res: Response): Promise<void> {
    try {
      if (!this.ticketCommentRepository) {
        sendFailure(res, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'Not implemented' });
        return;
      }
      const { id } = req.params;
      const { message, attachments, isInternal } = req.body as any;
      const { userId: authorId, role } = requireAuth(req);
      // Only admin or agent can create internal comments
      if (isInternal && role !== 'admin' && role !== 'agent') {
        sendFailure(res, {
          status: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden to create internal comment'
        });
        return;
      }
      const comment = await this.ticketCommentRepository.create({ ticketId: id, authorId, message, attachments, isInternal });
      // increment comments count
      if (this.ticketRepository) {
        await this.ticketRepository.incrementCommentsCount(id, 1);
      }
      sendSuccess(res, {
        status: HTTP_STATUS.CREATED,
        message: 'Comment added',
        data: comment
      });
    } catch (error: any) {
      handleControllerError(res, error, 'Lỗi khi thêm comment');
    }
  }

  async assign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body as any;
      const { role: userRole } = requireAuth(req);
      // only admin can assign (route also protected but double-check)
      if (userRole !== 'admin') {
        sendFailure(res, {
          status: HTTP_STATUS.FORBIDDEN,
          message: 'Only admin can assign tickets'
        });
        return;
      }
      if (!this.assignTicketUseCase) {
        sendFailure(res, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'Not implemented' });
        return;
      }
      const updated = await this.assignTicketUseCase.execute(id, assignedTo);
      sendSuccess(res, {
        message: 'Ticket assigned',
        data: TicketMapper.toDTO(updated)
      });
    } catch (error: any) {
      handleControllerError(res, error, 'Lỗi khi gán ticket');
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, resolutionMessage } = req.body as any;
      const { userId, role: userRole } = requireAuth(req);
      if (!this.updateTicketStatusUseCase) {
        sendFailure(res, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'Not implemented' });
        return;
      }

      // fetch ticket to check assigned_to
      const ticket = await this.getTicketByIdUseCase.execute(id);
      if (!ticket) {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: 'Ticket not found' });
        return;
      }

      const isAssignedUser = ticket.assigned_to && String(ticket.assigned_to) === String(userId);
      if (userRole !== 'admin' && !isAssignedUser && userRole !== 'agent') {
        sendFailure(res, {
          status: HTTP_STATUS.FORBIDDEN,
          message: 'Only admin or assigned agent can change status'
        });
        return;
      }

      const resolvedBy = status === 'resolved' || status === 'closed' ? userId : undefined;
      const updated = await this.updateTicketStatusUseCase.execute(id, status, resolvedBy, resolutionMessage);
      sendSuccess(res, {
        message: 'Ticket status updated',
        data: TicketMapper.toDTO(updated)
      });
    } catch (error: any) {
      handleControllerError(res, error, 'Lỗi khi cập nhật trạng thái ticket');
    }
  }
}
