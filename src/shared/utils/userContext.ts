import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../../config';

export async function resolveUserId(req?: Request): Promise<string | null> {
  if (req?.user?.userId) {
    return req.user.userId;
  }

  const authHeader = req?.headers?.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : undefined;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET as string) as { userId?: string };
      if (decoded?.userId) {
        return decoded.userId;
      }
    } catch {
    }
  }

  return null;
}
