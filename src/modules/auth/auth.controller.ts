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
import { LoginResponse } from './dtos/auth.response';

export class AuthController {
  private readonly isProduction: boolean;
  private readonly service: AuthService;
  private readonly hostUrl: string =
    process.env.HOST_URL || 'http://localhost:4123';
  private readonly refreshTokenPath: string = '/api/auth/v1/refresh-token';

  constructor() {
    this.isProduction = process.env.MODE == 'PROD';
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
    const verifyLink = `${this.hostUrl}/verify-email?token=${token}`;
    try {
      await emailService.sendVerifyAccountLink(
        userParams.displayName,
        userParams.email,
        verifyLink,
      );
    } catch (error) {
      logger.error(`Error sending verification email: ${error}`);
      throw new Error('Failed to send verification email');
    }

    res.json({
      message: 'Email Resent successfully',
    });
  }

  async resendVerificationEmail(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(CheckEmailRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const data = validatedRequest.data;
    const { email } = data.body;

    const token = await this.service.createEmailVerificationToken(email);

    const user = await this.service.findByEmail(email);

    const verifyLink = new URL(`${this.hostUrl}/verify-email`);

    verifyLink.searchParams.set('token', token);

    emailService.sendVerifyAccountLink(
      user.displayName,
      email,
      verifyLink.toString(),
    );

    res.json({
      message: 'Verification email resent successfully',
    });
  }

  async logInUser(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(LogInRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const logInParams = validatedRequest.data.body;

    const { tokens, userDetails } = await this.service.logInUser(logInParams);

    this.sendTokenResponse(
      req,
      res,
      tokens.accessToken,
      tokens.refreshToken,
      userDetails,
    );
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
    let incomingRefreshToken: string;
    if (this.isCross(req)) {
      incomingRefreshToken = req.headers['authorization']?.split(' ')[1] || '';
    } else {
      incomingRefreshToken = req.cookies['refreshToken'];
    }

    if (!incomingRefreshToken) {
      throw UnauthorizedError('Refresh token is required');
    }

    const { tokens, userId } =
      await this.service.refreshAccessToken(incomingRefreshToken);
    const userDetails = await this.service.getUserIntialDetails(userId);
    this.sendTokenResponse(
      req,
      res,
      tokens.accessToken,
      tokens.refreshToken,
      userDetails,
    );
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
      const resetLink = `${this.hostUrl}/reset-password?token=${token}`;

      logger.debug(`Generated password reset link for ${email}: ${token}`);

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

  private sendGoogleTokenResponse(
    req: Request,
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
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

    const redirectUrl = new URL(`${this.hostUrl}/home`);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);

    return res.redirect(redirectUrl.toString());
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
          const userCreditianls = await this.service.getUserIntialDetails(
            payload.userId,
          );

          const tokens = this.service.issueTokenPair(
            payload.userId,
            payload.role,
            payload.subscription,
          );

          return this.sendGoogleTokenResponse(
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

          const redirectUrl = new URL(`${this.hostUrl}/oauth-continue-details`);
          redirectUrl.searchParams.set('incompleteToken', incompleteToken);
          redirectUrl.searchParams.set('email', payload.email);
          redirectUrl.searchParams.set('displayName', payload.displayName);

          return res.redirect(redirectUrl.toString());
        }

        const { pendingToken } = await this.service.initiateGoogleSignIn({
          userId: payload.userId,
          role: payload.role,
          subscription: payload.subscription,
          email: payload.email,
          displayName: payload.displayName,
          googleId: payload.googleId,
        });

        const redirectUrl = new URL(`${this.hostUrl}/verify-code`);
        redirectUrl.searchParams.set('pendingToken', pendingToken);

        return res.redirect(redirectUrl.toString());
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
      const { tokens, userDetails } = await this.service.verifyGoogleSignInCode(
        pendingToken,
        code,
      );
      this.sendGoogleTokenResponse(
        req,
        res,
        tokens.accessToken,
        tokens.refreshToken,
      );
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
      const { tokens, userDetails } =
        await this.service.completeGoogleSignUp(body);
      this.sendGoogleTokenResponse(
        req,
        res,
        tokens.accessToken,
        tokens.refreshToken,
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

    const poll = await this.service.pollQRCodeForLogin(qrCode);

    if (!poll) {
      res.json({
        message: 'QR Code not yet scanned',
      });
      return;
    }

    this.sendTokenResponse(
      req,
      res,
      poll.tokens.accessToken,
      poll.tokens.refreshToken,
      poll.userDetails,
    );
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
    userCreditianls?: LoginResponse,
    status = 200,
  ) {
    if (this.isCross(req)) {
      return res.status(status).json({
        message: 'Authenticated successfully',
        data: {
          accessToken,
          refreshToken,
          user: userCreditianls,
        },
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

    return res.status(status).json({
      message: 'Authenticated successfully',
      data: { user: userCreditianls },
    });
  }
}
