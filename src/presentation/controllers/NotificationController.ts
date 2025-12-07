import { Request, Response } from 'express';
import { notificationService, NotificationStatusFilter } from '../../services/notification/NotificationService';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';
import { handleControllerError, requireAuth, sendFailure, sendSuccess } from '../../shared/utils/controllerUtils';

export class NotificationController {
  async send(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as any;
      const { audience, targetId, type, title, message, payload } = body;
      if (!audience || !title || !message) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'Missing audience/title/message'
        });
        return;
      }

      const result = await notificationService.send({ audience, targetId, type, title, message, payload });
      if (!result) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'Failed to send notification'
        });
        return;
      }
      sendSuccess(res, { data: result });
    } catch (err: any) {
      handleControllerError(res, err, 'Internal error');
    }
  }

  // admin endpoint to broadcast to all users or all shops
  async broadcast(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as any;
      const { audience, type, title, message, payload } = body;
      if (!audience || !title || !message) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'Missing audience/title/message'
        });
        return;
      }
      if (audience !== 'all_users' && audience !== 'all_shops') {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'Invalid audience for broadcast'
        });
        return;
      }

      const result = await notificationService.send({ audience, type, title, message, payload });
      if (!result) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'Failed to broadcast notification'
        });
        return;
      }
      sendSuccess(res, { data: result });
    } catch (err: any) {
      handleControllerError(res, err, 'Internal error');
    }
  }
  // user endpoint to list their notifications
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { userId, role } = requireAuth(req);

      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(100, Math.max(5, parseInt(String(req.query.limit ?? '10'), 10)));
      const rawStatus = String(req.query.status ?? 'all').toLowerCase() as NotificationStatusFilter;
      const status: NotificationStatusFilter = ['all', 'read', 'unread'].includes(rawStatus) ? rawStatus : 'all';
      const targetUserId = role === 'admin' ? (req.query.userId as string | undefined) : undefined;

      const result = await notificationService.listUserNotifications({
        userId,
        role,
        targetUserId,
        page,
        limit,
        status,
      });

      sendSuccess(res, { data: result.items, meta: result.meta });
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('invalid')) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: err.message });
        return;
      }
      handleControllerError(res, err, 'Internal error');
    }
  }

  async markRead(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = requireAuth(req);
      const { id } = req.params;

      const updated = await notificationService.markAsRead(userId, id);
      if (!updated) {
        sendFailure(res, { status: HTTP_STATUS.NOT_FOUND, message: 'Not found' });
        return;
      }

      sendSuccess(res, { data: updated });
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('invalid')) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: err.message });
        return;
      }
      handleControllerError(res, err, 'Internal error');
    }
  }

  async markAllRead(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = requireAuth(req);

      const updated = await notificationService.markAllAsRead(userId);
      sendSuccess(res, { data: { updated } });
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('invalid')) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: err.message });
        return;
      }
      handleControllerError(res, err, 'Internal error');
    }
  }

  async summary(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = requireAuth(req);

      const data = await notificationService.getSummary(userId);
      sendSuccess(res, { data });
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('invalid')) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: err.message });
        return;
      }
      handleControllerError(res, err, 'Internal error');
    }
  }
}

export const notificationController = new NotificationController();
