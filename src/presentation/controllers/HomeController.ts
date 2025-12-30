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
}

export const homeController = new HomeController();
