import { Request, Response } from 'express';
import { homeService } from '../../services/home/HomeService';
import { handleControllerError, sendSuccess } from '../../shared/utils/controllerUtils';

export class HomeController {
  async getDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const payload = await homeService.getDashboard();
      sendSuccess(res, { data: payload });
    } catch (error: any) {
      handleControllerError(res, error, 'Không thể lấy dữ liệu trang chủ');
    }
  }
}

export const homeController = new HomeController();
