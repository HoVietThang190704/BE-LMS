import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';

export class AddressController {
  getUserAddresses(_: Request, res: Response) {
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json({ success: false, message: 'Address feature is not available in this build.' });
  }

  setDefaultAddress(_: Request, res: Response) {
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json({ success: false, message: 'Address feature is not available in this build.' });
  }
}
