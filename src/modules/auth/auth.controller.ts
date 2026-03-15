import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { AuthService } from './auth.service';
import {
  CheckEmailRequestDTO,
  ForgotPasswordRequestDTO,
  LogInRequestDTO,
  ResetPasswordRequestDTO,
  SignUpRequestDTO,
  VerifyEmailRequestDTO,
} from './dtos/auth.request';
import emailService from '../../shared/abstractions/email/EmailService';
import logger from '../../shared/logger/logger';

export class AuthController {
  private isProduction: boolean;
  private readonly service: AuthService;
  private readonly hostUrl: string =
    process.env.HOST_URL || 'http://localhost:4123';
  private readonly urlPrefix: string = '/api/auth';

  constructor() {
    this.isProduction = process.env.NODE_ENV == 'PROD';
    this.service = new AuthService();
  }

  private isCross(req: Request): boolean {
    const userAgent = req.headers['user-agent'] || '';
    // check if user Agent contains these
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    );
  }

  async checkEmailExists(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(CheckEmailRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const data = validatedRequest.data;
    const { email } = data.body;

    const exists = await this.service.doesEmailExists(email);

    res.json({
      message: 'Email Checked Sucessfully',
      data: {
        exists: exists,
      },
    });
  }

  async registerUser(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(SignUpRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userParams = validatedRequest.data.body;
    const isNewUserCreated = await this.service.registerNewUser(userParams);

    if (!isNewUserCreated) {
      throw new Error('User Registration Failed');
    }

    res.status(201).json({
      message: 'User Signed Up Sucessfully',
    });

    const token = await this.service.createEmailVerificationToken(
      userParams.email,
    );

    // ! 7aseb mn v1 de
    const verifyLink = `${this.hostUrl}${this.urlPrefix}/v1/verify-email?token=${token}`;
    emailService.sendVerifyAccountLink(
      userParams.displayName,
      userParams.email,
      verifyLink,
    );
  }

  async logInUser(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(LogInRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const logInParams = validatedRequest.data.body;

    const { accessToken, refreshToken } =
      await this.service.logInUser(logInParams);

    if (this.isCross(req)) {
      res.json({
        message: 'User Logged In Sucessfully',
        data: {
          acessToken: accessToken,
          refreshToken: refreshToken,
        },
      });
    } else {
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'strict', // CSRF protection : another website access the token if not implied
        maxAge: 1000 * 60 * 60 * 1,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });

      res.json({
        message: 'User Logged In Successfully',
      });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(VerifyEmailRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const token = validatedRequest!.data!.query.token;

    logger.info(`Received email verification request with token: ${token}`);

    const isVerified = await this.service.verifyEmail(token);

    if (!isVerified) {
      throw new Error('Email Verification Failed');
    }

    res.json({
      message: 'Email Verified Successfully',
    });
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    if (this.isCross(req)) {
      const incomingRefreshToken =
        req.headers['authorization']?.split(' ')[1] || '';
      if (!incomingRefreshToken) {
        throw new Error('Refresh token is required');
      }

      const newAccessToken =
        await this.service.refreshAccessToken(incomingRefreshToken);

      res.json({
        message: 'Token Refreshed Successfully',
        data: {
          accessToken: newAccessToken,
        },
      });
    } else {
      const incomingRefreshToken = req.cookies['refreshToken'];
      if (!incomingRefreshToken) {
        throw new Error('Refresh token is required');
      }

      const newAccessToken =
        await this.service.refreshAccessToken(incomingRefreshToken);

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 1,
      });

      res.json({
        message: 'Token Refreshed Successfully',
      });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(ForgotPasswordRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const email = validatedRequest.data.body.email;
    const { token, userName } =
      await this.service.createPasswordResetToken(email);

    try {
      // ! 7aseb mn v1 de
      // https:beatza/{varaible}
      const resetLink = `${this.hostUrl}${this.urlPrefix}/v1/reset-password?token=${token}`;

      logger.info(`Generated password reset link for ${email}: ${token}`);

      await emailService.sendResetPassowordLink(userName, email, resetLink);
      res.json({
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}: ${error}`);
      throw new Error('Failed to send password reset link');
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(ResetPasswordRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { token, newPassword } = validatedRequest.data.body;

    const isPasswordReset = await this.service.resetPasswordWithToken(
      token,
      newPassword,
    );

    if (!isPasswordReset) {
      throw new Error('Failed to reset password');
    }

    res.json({
      message: 'Password reset successfully',
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    if (this.isCross(req)) {
      res.json({
        message: 'User Logged Out Sucessfully',
        data: {
          acessToken: null,
          refreshToken: null,
        },
      });
    } else {
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'strict',
      });

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'strict',
      });

      res.json({
        message: 'User Logged Out Successfully',
      });
    }
  }
}
