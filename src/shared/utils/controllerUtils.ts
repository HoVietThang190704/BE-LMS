import { Request, Response } from 'express';
import { UnauthorizedError } from '../middleware/errorHandler';
import { HTTP_STATUS, HttpStatusCode } from '../constants/httpStatus';
import { logger } from './logger';

interface SuccessPayload<T = unknown> {
  status?: HttpStatusCode;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
}

interface ErrorPayload {
  status?: HttpStatusCode;
  message: string;
  errors?: unknown;
}

export const requireAuth = (req: Request, message = 'Unauthorized') => {
  if (!req.user || !req.user.userId) {
    throw new UnauthorizedError(message);
  }
  return req.user;
};

export const sendSuccess = <T>(res: Response, payload: SuccessPayload<T>) => {
  const { status = HTTP_STATUS.OK, message, data, meta } = payload;
  return res.status(status).json({
    success: true,
    ...(message !== undefined && { message }),
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta })
  });
};

export const sendFailure = (res: Response, payload: ErrorPayload) => {
  const { status = HTTP_STATUS.BAD_REQUEST, message, errors } = payload;
  return res.status(status).json({
    success: false,
    message,
    ...(errors !== undefined && { errors })
  });
};

export const handleControllerError = (
  res: Response,
  error: any,
  fallbackMessage: string
) => {
  logger.error(fallbackMessage, {
    error: error?.message,
    stack: error?.stack
  });

  const derivedStatus = typeof error?.statusCode === 'number' ? error.statusCode : undefined;
  const status = derivedStatus ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = derivedStatus && typeof error?.message === 'string' ? error.message : fallbackMessage;

  return sendFailure(res, { status, message });
};
