import { Request, Response } from 'express';
import { gradeService } from '../../services/GradeService';
import { resolveUserId } from '../../shared/utils/userContext';
import { sendSuccess, sendFailure, handleControllerError } from '../../shared/utils/controllerUtils';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';

export class GradeController {

  static async getMyGrades(req: Request, res: Response): Promise<void> {
    try {
      const userId = await resolveUserId(req);
      if (!userId) {
        sendFailure(res, { status: HTTP_STATUS.UNAUTHORIZED, message: 'User is not authenticated' });
        return;
      }

      const grades = await gradeService.getUserGrades(userId);
      sendSuccess(res, { data: grades });
    } catch (error) {
      handleControllerError(res, error, 'Không thể lấy bảng điểm');
    }
  }

  static async getMyProgressReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = await resolveUserId(req);
      if (!userId) {
        sendFailure(res, { status: HTTP_STATUS.UNAUTHORIZED, message: 'User is not authenticated' });
        return;
      }

      const report = await gradeService.getUserProgressReport(userId);
      sendSuccess(res, { data: report });
    } catch (error) {
      handleControllerError(res, error, 'Không thể lấy báo cáo tiến độ');
    }
  }
}
