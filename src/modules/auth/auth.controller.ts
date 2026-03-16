import { Request, Response, NextFunction } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { AuthService, GoogleCompleteSignUpBody } from './auth.service';
import {
  CheckEmailRequestDTO,
  DesktopPollingRequestDTO,
  ForgotPasswordRequestDTO,
  GoogleCallbackRequestDTO,
  GoogleCompleteSignUpRequestDTO,
  GoogleVerifyCodeRequestDTO,
  LogInRequestDTO,
  MobileLoginApprovalRequestDTO,
  ResetPasswordRequestDTO,
  SignUpRequestDTO,
  VerifyEmailRequestDTO,
} from './dtos/auth.request';
import emailService from '../../shared/abstractions/email/EmailService';
import passport, { GoogleAuthPayload } from './auth.utils';
import logger from '../../shared/logger/logger';
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from '../../shared/errors/responseErrors';
import { JWTPayload } from '../../shared/abstractions/jwt';

export class AuthController {
  private readonly isProduction: boolean;
  private readonly service: AuthService;
  private readonly hostUrl: string =
    process.env.HOST_URL || 'http://localhost:4123';
  private readonly urlPrefix: string = '/api/auth';
  private readonly refreshTokenPath: string = '/api/auth/v1/refresh-token';

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

    this.sendTokenResponse(req, res, accessToken, refreshToken);
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
        throw UnauthorizedError('Refresh token is required');
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
        throw UnauthorizedError('Refresh token is required');
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
        path: this.refreshTokenPath,
      });

      res.json({
        message: 'User Logged Out Successfully',
      });
    }
  }

  googleRedirect = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
    })(req, res, next);
  };

  googleCallback = (req: Request, res: Response, next: NextFunction): void => {
    const validatedRequest = parseRequest(GoogleCallbackRequestDTO, req);
    if (!validatedRequest.success) {
      return next(BadRequestError('Invalid request data'));
    }

    passport.authenticate(
      'google',
      { session: false, failWithError: true },
      async (err: Error | null, payload: GoogleAuthPayload | false) => {
        if (err) return next(err);
        if (!payload)
          return next(ForbiddenError('Google authentication failed'));

        logger.info(
          `Google authentication successful for email: ${JSON.stringify(payload)}`,
        );

        if (payload.status === 'returning_google') {
          const tokens = this.service.issueTokenPair(
            payload.userId,
            payload.role,
            payload.subscription,
          );
          return this.sendTokenResponse(
            req,
            res,
            tokens.accessToken,
            tokens.refreshToken,
          );
        }

        if (payload.status === 'new') {
          const incompleteToken = this.service.issueIncompleteToken({
            googleId: payload.googleId,
            email: payload.email,
            displayName: payload.displayName,
          });

          return res.status(200).json({
            status: 'incomplete',
            incompleteToken,
            email: payload.email,
            displayName: payload.displayName,
          });
        }

        const { pendingToken } = await this.service.initiateGoogleSignIn({
          userId: payload.userId,
          role: payload.role,
          subscription: payload.subscription,
          email: payload.email,
          displayName: payload.displayName,
          googleId: payload.googleId,
        });

        return res.status(200).json({
          status: 'verify',
          pendingToken,
        });
      },
    )(req, res, next);
  };

  googleVerifyCode = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const validatedRequest = parseRequest(GoogleVerifyCodeRequestDTO, req);
    if (!validatedRequest.success) {
      return next(BadRequestError('Invalid request data'));
    }

    try {
      const { pendingToken, code } = validatedRequest.data.body;
      const tokens = await this.service.verifyGoogleSignInCode(
        pendingToken,
        code,
      );
      this.sendTokenResponse(req, res, tokens.accessToken, tokens.refreshToken);
    } catch (err) {
      next(err);
    }
  };

  googleCompleteSignUp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const validatedRequest = parseRequest(GoogleCompleteSignUpRequestDTO, req);

    if (!validatedRequest.success) {
      return next(BadRequestError('Invalid request data'));
    }

    try {
      const body = req.body as GoogleCompleteSignUpBody;
      const tokens = await this.service.completeGoogleSignUp(body);
      this.sendTokenResponse(
        req,
        res,
        tokens.accessToken,
        tokens.refreshToken,
        201,
      );
    } catch (err) {
      next(err);
    }
  };

  createQRCode = async (req: Request, res: Response): Promise<void> => {
    const pendingToken = await this.service.createQRCodeForDesktopLogin();
    res.json({
      message: 'QR Code generated successfully',
      pendingToken,
    });
  };

  pollQRCode = async (req: Request, res: Response): Promise<void> => {
    const validatedRequest = parseRequest(DesktopPollingRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { qrCode } = validatedRequest.data.body;

    const tokens = await this.service.pollQRCodeForLogin(qrCode);

    if (!tokens) {
      res.json({
        message: 'QR Code not yet scanned',
        data: null,
      });
      return;
    }

    this.sendTokenResponse(req, res, tokens.accessToken, tokens.refreshToken);
  };

  approveLoginFromMobile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const validatedRequest = parseRequest(MobileLoginApprovalRequestDTO, req);

    if (!validatedRequest.success) {
      return next(BadRequestError('Invalid request data'));
    }
    const { qrCode } = validatedRequest.data.body;

    const { _id, role, paymentInfo } = req.userInfo! as JWTPayload;

    await this.service.approveDesktopLogin(qrCode, _id, role, paymentInfo);

    res.json({
      message: 'Login approved successfully',
    });
  };

  private sendTokenResponse(
    req: Request,
    res: Response,
    accessToken: string,
    refreshToken: string,
    status = 200,
  ) {
    if (this.isCross(req)) {
      return res.status(status).json({
        message: 'Authenticated successfully',
        data: { accessToken, refreshToken },
      });
    }

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 1,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: this.refreshTokenPath,
    });

    return res.status(status).json({ message: 'Authenticated successfully' });
  }
}
