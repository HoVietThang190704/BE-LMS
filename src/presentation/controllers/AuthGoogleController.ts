import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../../models/users/User';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';
import { handleControllerError, sendFailure, sendSuccess } from '../../shared/utils/controllerUtils';

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

export default class AuthGoogleController {
  static async token(req: Request, res: Response) {
    try {
      const { id_token } = req.body;
      if (!id_token) {
        sendFailure(res, { status: HTTP_STATUS.BAD_REQUEST, message: 'id_token required' });
        return;
      }

      // TEMP DEBUG: decode token without verification to inspect `aud` claim
      let decodedAud: string | string[] | undefined | null = null;
      try {
        // jwt.decode only parses the token; it does NOT verify signature — safe for debugging
        const decoded = jwt.decode(id_token) as unknown as { aud?: string | string[] } | null;
        decodedAud = decoded?.aud;
        logger.info(`Debug: decoded id_token aud: ${JSON.stringify(decodedAud)}`);
        logger.info(`Debug: server GOOGLE_CLIENT_ID: ${config.GOOGLE_CLIENT_ID}`);
      } catch (dErr) {
        logger.warn('Debug: failed to decode id_token for inspection', dErr);
      }

      let ticket;
      try {
        // Support multiple acceptable audiences (helpful in dev/testing when tokens
        // may be issued to different OAuth client IDs). Configure via
        // `GOOGLE_CLIENT_AUDIENCES` (comma-separated) or fall back to `GOOGLE_CLIENT_ID`.
        const audiencesEnv = config.GOOGLE_CLIENT_AUDIENCES;
        const audiences = audiencesEnv
          ? audiencesEnv.split(',').map((s) => s.trim()).filter(Boolean)
          : [config.GOOGLE_CLIENT_ID];

        logger.info(`AuthGoogleController: verifying id_token against audiences: ${JSON.stringify(audiences)}`);

        ticket = await client.verifyIdToken({ idToken: id_token, audience: audiences });
      } catch (verifyErr) {
        logger.error('AuthGoogleController.verifyIdToken failed:', verifyErr);
        logger.info(`Debug (post-verify) decoded aud: ${JSON.stringify(decodedAud)}`);
        if (config.NODE_ENV !== 'production') {
          sendFailure(res, {
            status: HTTP_STATUS.BAD_REQUEST,
            message: 'Invalid Google token (aud mismatch)',
            errors: { token_aud: decodedAud, expected_aud: config.GOOGLE_CLIENT_ID }
          });
          return;
        }
        sendFailure(res, { status: HTTP_STATUS.UNAUTHORIZED, message: 'Invalid Google token' });
        return;
      }
      const payload = ticket.getPayload();
      if (!payload) {
        sendFailure(res, { status: HTTP_STATUS.UNAUTHORIZED, message: 'Invalid Google token' });
        return;
      }

      const googleId = payload.sub as string;
      const email = (payload.email || '').toLowerCase();
      const name = payload.name as string | undefined;
      const picture = payload.picture as string | undefined;
      const email_verified = payload.email_verified === true;

      // Try to find existing user by googleId
      let user = await User.findOne({ googleId: googleId });

      if (!user && email) {
        // Try to find by email
        user = await User.findOne({ email });
        if (user) {
          // Link account: set googleId and mark verified if Google says so
          user.googleId = googleId;
          if (email_verified) user.isVerified = true;

          if (picture) {
            user.profile = {
              ...(user.profile || {}),
              avatarUrl: user.profile?.avatarUrl ?? picture
            };
          }

          await user.save();
        }
      }

      if (!user) {
        // Create a new user. Password is required by schema, so set a random one.
        const randomPassword = crypto.randomBytes(20).toString('hex');
        const salt = await bcrypt.genSalt(12);
        const hashed = await bcrypt.hash(randomPassword, salt);

        const newUser = new User({
          email,
          passwordHash: hashed,
          fullName: name,
          profile: picture ? { avatarUrl: picture } : undefined,
          googleId,
          isVerified: email_verified,
          role: 'student',
          isActive: true
        });
        await newUser.save();
        user = newUser;
      }

      // Issue application JWTs (access + refresh) using existing config
      const payloadJwt = { userId: user._id, email: user.email, role: user.role };
      const secret = config.JWT_SECRET as string;
      const accessToken = jwt.sign(payloadJwt, secret as jwt.Secret, { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
      const refreshToken = jwt.sign(payloadJwt, secret as jwt.Secret, { expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

      sendSuccess(res, {
        message: 'Google login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            fullName: (user as any).fullName,
            userName: (user as any).fullName,
            phone: user.profile?.phone,
            address: user.profile?.address,
            avatarUrl: user.profile?.avatarUrl,
            facebookId: (user as any).facebookId || (user as any).facebookID,
            googleId: (user as any).googleId,
            role: user.role,
            isVerified: user.isVerified
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      handleControllerError(res, error, 'Internal server error');
    }
  }
}
