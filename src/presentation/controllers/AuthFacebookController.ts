import { Request, Response } from 'express';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../../models/users/User';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';
import { handleControllerError, sendFailure, sendSuccess } from '../../shared/utils/controllerUtils';

export default class AuthFacebookController {
  /**
   * Verify Facebook access token and login/register user
   * Client sends: { access_token: string }
   */
  static async token(req: Request, res: Response) {
    try {
      const { access_token } = req.body;
      if (!access_token) {
        sendFailure(res, {
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'access_token is required'
        });
        return;
      }

      // Verify token with Facebook Graph API
      // https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#checktoken
      const debugTokenUrl = `https://graph.facebook.com/debug_token?input_token=${access_token}&access_token=${config.FACEBOOK_APP_ID}|${config.FACEBOOK_APP_SECRET}`;
      
      let debugResponse;
      try {
        debugResponse = await axios.get(debugTokenUrl);
      } catch (err: any) {
        logger.error('Facebook token debug failed:', err.response?.data || err.message);
        sendFailure(res, {
          status: HTTP_STATUS.UNAUTHORIZED,
          message: 'Invalid Facebook access token'
        });
        return;
      }

      const { data: tokenData } = debugResponse.data;
      
      // Check if token is valid
      if (!tokenData.is_valid) {
        sendFailure(res, {
          status: HTTP_STATUS.UNAUTHORIZED,
          message: 'Facebook token is not valid'
        });
        return;
      }

      // Check if app_id matches
      if (tokenData.app_id !== config.FACEBOOK_APP_ID) {
        sendFailure(res, {
          status: HTTP_STATUS.UNAUTHORIZED,
          message: 'Facebook token app_id mismatch'
        });
        return;
      }

      const facebookId = tokenData.user_id;

      // Get user profile from Facebook
      const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`;
      
      let profileResponse;
      try {
        profileResponse = await axios.get(profileUrl);
      } catch (err: any) {
        logger.error('Facebook profile fetch failed:', err.response?.data || err.message);
        sendFailure(res, {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch Facebook profile'
        });
        return;
      }

      const profile = profileResponse.data;
      const email = profile.email ? profile.email.toLowerCase() : null;
      const name = profile.name;
      const picture = profile.picture?.data?.url;

      logger.info(`Facebook login attempt - ID: ${facebookId}, Email: ${email || 'N/A'}`);

      // Try to find existing user by facebookId
      let user = await User.findOne({ facebookId: facebookId });

      if (!user && email) {
        // Try to find by email to link accounts
        user = await User.findOne({ email });
        if (user) {
          // Link Facebook account
          user.facebookId = facebookId;
          user.isActive = true; // Facebook verified email
          if (!user.profile?.avatarUrl && picture) {
            user.profile = { ...(user.profile || {}), avatarUrl: picture } as any;
          }
          await user.save();
          logger.info(`Linked Facebook account to existing user: ${email}`);
        }
      }

      if (!user) {
        // Create new user
        const randomPassword = crypto.randomBytes(20).toString('hex');
        const salt = await bcrypt.genSalt(12);
        const hashed = await bcrypt.hash(randomPassword, salt);

        // If no email from Facebook, create a placeholder
        const userEmail = email || `${facebookId}@facebook.local`;

        const newUser = new User({
          email: userEmail,
          passwordHash: hashed,
          fullName: name,
          profile: picture ? { avatarUrl: picture } : undefined,
          facebookId: facebookId,
          isActive: !!email,
          role: 'student'
        });

        await newUser.save();
        user = newUser;
        logger.info(`New user created via Facebook: ${userEmail}`);
      }

      // Generate JWT tokens
      const payloadJwt = { userId: user._id, email: user.email, role: user.role };
      const secret = config.JWT_SECRET as string;
      const accessToken = jwt.sign(payloadJwt, secret as jwt.Secret, {
        expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
      });
      const refreshToken = jwt.sign(payloadJwt, secret as jwt.Secret, {
        expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']
      });

      sendSuccess(res, {
        message: 'Facebook login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            fullName: (user as any).fullName,
            profile: (user as any).profile,
            facebookId: (user as any).facebookId,
            googleId: (user as any).googleId,
            role: user.role,
            isActive: user.isActive
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error: any) {
      if (config.NODE_ENV === 'development') {
        sendFailure(res, {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          errors: { error: error.message }
        });
        return;
      }
      handleControllerError(res, error, 'Internal server error');
    }
  }
}
