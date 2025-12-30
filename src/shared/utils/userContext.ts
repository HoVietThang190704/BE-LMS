import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { User } from '../../models/users/User';
import { config } from '../../config';

let cachedUserId: string | null = null;

export async function resolveUserId(req?: Request): Promise<string | null> {
  if (req?.user?.userId) {
    return req.user.userId;
  }

  const token = req?.headers?.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET as string) as { userId?: string };
      if (decoded?.userId) {
        return decoded.userId;
      }
    } catch {
    }
  }

  if (cachedUserId) return cachedUserId;

  const user = await User.findOne().sort({ createdAt: 1 }).select('_id').lean();
  cachedUserId = user?._id?.toString() || null;
  return cachedUserId;
}
