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
import { JWTPayload } from '../../shared/abstractions/jwt.service';
import { LoginResponse } from './dtos/auth.response';
import SecureParams from '../../shared/abstractions/security.service';

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

    const verifyLink = new URL(`${this.hostUrl}/verify-email`);

    const encryptedToken = SecureParams.encrypt(token);

    verifyLink.searchParams.set('token', encryptedToken);
    try {
      await emailService.sendVerifyAccountLink(
        userParams.displayName,
        userParams.email,
        verifyLink.toString(),
      );
    } catch (error) {
      logger.error(`Error sending verification email: ${error}`);
      throw new Error('Failed to send verification email');
    }
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

    const encryptedToken = SecureParams.encrypt(token);
    verifyLink.searchParams.set('token', encryptedToken);

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

    if (validatedRequest.data.query.client === 'Android') {
      return res.redirect(
        `${this.hostUrl}/cross-callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
      );
    }

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

    const decryptedToken = SecureParams.decrypt(token);

    logger.info(
      `Received email verification request with token: ${decryptedToken}`,
    );

    const isVerified = await this.service.verifyEmail(decryptedToken);

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

  async forgotPasswordForLoggedInUser(
    req: Request,
    res: Response,
  ): Promise<void> {
    const userId = req.userInfo!._id;

    const { token, userName, email } =
      await this.service.createPasswordResetTokenForLoggedInUser(userId);

    try {
      const resetLink = new URL(`${this.hostUrl}/reset-password`);

      const encryptedToken = SecureParams.encrypt(token);
      resetLink.searchParams.set('token', encryptedToken);

      logger.debug(
        `Generated password reset link for ${email}: ${encryptedToken}`,
      );

      await emailService.sendResetPassowordLink(
        userName,
        email,
        resetLink.toString(),
      );

      res.json({
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}: ${error}`);
      throw new Error('Failed to send password reset link');
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
      const resetLink = new URL(`${this.hostUrl}/reset-password`);

      const encryptedToken = SecureParams.encrypt(token);
      resetLink.searchParams.set('token', encryptedToken);

      logger.debug(
        `Generated password reset link for ${email}: ${encryptedToken}`,
      );

      await emailService.sendResetPassowordLink(
        userName,
        email,
        resetLink.toString(),
      );

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

    const decryptedToken = SecureParams.decrypt(token);

    logger.debug(
      `Received password reset request with token: ${decryptedToken}`,
    );

    const isPasswordReset = await this.service.resetPasswordWithToken(
      decryptedToken,
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
    const client =
      typeof req.query.client === 'string' ? req.query.client : undefined;

    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      state: client,
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
          `Google authentication intiation successful with status: ${payload.status}`,
        );

        if (payload.status === 'returning_google') {
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
            payload.client,
          );
        }

        if (payload.status === 'new') {
          const incompleteToken = this.service.issueIncompleteToken({
            googleId: payload.googleId,
            email: payload.email,
            displayName: payload.displayName,
          });

          const redirectUrl = new URL(`${this.hostUrl}/oauth-continue-details`);

          redirectUrl.searchParams.set(
            'incompleteToken',
            SecureParams.encrypt(incompleteToken),
          );
          redirectUrl.searchParams.set('email', 'No');
          redirectUrl.searchParams.set('displayName', payload.displayName);
          if (payload.client) {
            redirectUrl.searchParams.set('client', payload.client);
          }

          return res.redirect(redirectUrl.toString());
        }

        const pendingToken = await this.service.initiateGoogleSignIn({
          userId: payload.userId,
          role: payload.role,
          subscription: payload.subscription,
          email: payload.email,
          displayName: payload.displayName,
          googleId: payload.googleId,
        });

        const redirectUrl = new URL(`${this.hostUrl}/verify-code`);
        redirectUrl.searchParams.set(
          'pendingToken',
          SecureParams.encrypt(pendingToken),
        );

        if (payload.client) {
          redirectUrl.searchParams.set('client', payload.client);
        }

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

      const decryptedPendingToken = SecureParams.decrypt(pendingToken);
      const { accessToken, refreshToken } =
        await this.service.verifyGoogleSignInCode(decryptedPendingToken, code);
      this.sendGoogleTokenResponse(req, res, accessToken, refreshToken);
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
      const { incompleteToken, dateOfBirth, gender } =
        req.body as GoogleCompleteSignUpBody;

      const decryptedIncompleteToken = SecureParams.decrypt(incompleteToken);

      const { accessToken, refreshToken } =
        await this.service.completeGoogleSignUp({
          incompleteToken: decryptedIncompleteToken,
          dateOfBirth,
          gender,
        });
      this.sendGoogleTokenResponse(req, res, accessToken, refreshToken);
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

  private sendGoogleTokenResponse(
    req: Request,
    res: Response,
    accessToken: string,
    refreshToken: string,
    client?: string,
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

    let redirectUrl = new URL(`${this.hostUrl}/home`);
    const activeClient =
      client ?? (typeof req.query.client === 'string' ? req.query.client : '');

    if (activeClient === 'Android') {
      redirectUrl = new URL(`${this.hostUrl}/cross-callback`);
      redirectUrl.searchParams.set('accessToken', accessToken);
      redirectUrl.searchParams.set('refreshToken', refreshToken);
    }

    return res.redirect(redirectUrl.toString());
  }

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
          user: userCreditianls,
          accessToken,
          refreshToken,
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
      data: {
        user: userCreditianls,
        accessToken,
        refreshToken,
      },
    });
  }

  async deleteAccount(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const paymentInfo = req.userInfo!.paymentInfo;

    await this.service.deleteAcount(userId, paymentInfo);

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
      message: 'Account deleted successfully',
    });
  }
}
