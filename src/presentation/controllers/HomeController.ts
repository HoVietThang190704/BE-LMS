import { Request, Response } from 'express';
import { homeService } from '../../services/home/HomeService';
import { handleControllerError, sendSuccess } from '../../shared/utils/controllerUtils';
import { resolveUserId } from '../../shared/utils/userContext';

export class HomeController {
  async getDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const userId = await resolveUserId(_req);
      const payload = await homeService.getDashboard(userId);
      sendSuccess(res, { data: payload });
    } catch (error: any) {
      handleControllerError(res, error, 'Không thể lấy dữ liệu trang chủ');
    }
  }

  async listCourses(req: Request, res: Response): Promise<void> {
    try {
      const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
      const pageParam = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
      const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;

      const page = Number.parseInt(String(pageParam ?? ''), 10);
      const limit = Number.parseInt(String(limitParam ?? ''), 10);

      const payload = await homeService.getMonitoringClasses({
        keyword,
        page: Number.isFinite(page) ? page : undefined,
        limit: Number.isFinite(limit) ? limit : undefined,
      });

      sendSuccess(res, { data: payload });
    } catch (error: any) {
      handleControllerError(res, error, 'Không thể lấy danh sách môn học');
    }
  }
}

export const homeController = new HomeController();
