import bcrypt from 'bcrypt';
import crypto from 'crypto';
import {
  BadRequestError,
  ForbiddenError,
  GoneError,
  NotFoundError,
  ResourceAlreadyExists,
  UnauthorizedError,
} from '../../shared/errors/responseErrors';
import { LoginResponse, LoginSession, AuthTokens } from './dtos/auth.response';
import { AuthRepository } from './auth.repository';
import JWTService, { JWTPayload } from '../../shared/abstractions/jwt.service';
import emailService from '../../shared/abstractions/email/email.service';
import { AuthMapper } from './dtos/auth.mapper';
import { PaymentInfo } from '../../shared/models/models.user';
import { paymentController } from '../payment/payment.routes';
import {
  GoogleCompleteSignUpBody,
  LoginRequestBody,
  SignUpRequestBody,
} from './dtos/auth.request.body';
import {
  AuthGoogleService,
  SendGoogleVerificationCode,
} from './auth.google.service';
import { AuthQRLoginService } from './auth.qrlogin.service';

export class AuthService {
  private readonly jwtService: JWTService;
  private readonly authRepository: AuthRepository;

  private readonly googleService: AuthGoogleService;
  private readonly qrService: AuthQRLoginService;

  constructor() {
    this.jwtService = new JWTService();
    this.authRepository = new AuthRepository();
    this.googleService = new AuthGoogleService(
      this.authRepository,
      this.jwtService,
    );

    this.qrService = new AuthQRLoginService(
      this.authRepository,
      this.jwtService,
    );
  }

  private async hashPassowrd(password: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  async doesEmailExists(email: string): Promise<Boolean> {
    const result = await this.authRepository.findByEmail(email);
    if (!result) {
      return false;
    } else {
      return true;
    }
  }

  async findByEmail(email: string) {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw NotFoundError('User not found');
    }
    return AuthMapper.toUserCredientialsResponse(user);
  }

  async registerNewUser(newUserDTO: SignUpRequestBody): Promise<Boolean> {
    const existingUser = await this.authRepository.findByEmail(
      newUserDTO.email,
    );

    if (existingUser) {
      throw ResourceAlreadyExists('Email Already Exists');
    }

    try {
      const hashedPass = await this.hashPassowrd(newUserDTO.password);
      await this.authRepository.create(
        newUserDTO.email,
        hashedPass,
        newUserDTO.displayName,
        newUserDTO.dateOfBirth,
        newUserDTO.gender,
      );

      return true;
    } catch (error) {
      throw new Error('Failed to register new user');
    }
  }

  async createEmailVerificationToken(email: string): Promise<string> {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw NotFoundError('User not found');
    }

    const token = this.jwtService.createJWTForEmails(user._id.toString());

    return token;
  }

  async getUserIntialDetails(userId: string): Promise<LoginResponse> {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw NotFoundError('User not found');
    }

    return AuthMapper.toUserCredientialsResponse(user);
  }

  async createPasswordResetTokenForLoggedInUser(
    userId: string,
  ): Promise<{ token: string; userName: string; email: string }> {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw NotFoundError('User not found');
    }

    const token = this.jwtService.createJWTForEmails(user._id.toString());

    return {
      token,
      userName: user.displayName as string,
      email: user.email as string,
    };
  }

  async createPasswordResetToken(
    email: string,
  ): Promise<{ token: string; userName: string }> {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw NotFoundError('User not found');
    }

    const token = this.jwtService.createJWTForEmails(user._id.toString());

    return { token, userName: user.displayName as string };
  }

  async resetPasswordWithToken(
    token: string,
    newPassword: string,
  ): Promise<Boolean> {
    const payload = this.jwtService.verifyJWTForEmails(token);
    const user = await this.authRepository.findByIdForPasswordComparing(
      payload!._id,
    );

    if (!user) {
      throw NotFoundError('User not found');
    }
    const hashedPass = await this.hashPassowrd(newPassword);

    if (!user.password) {
      await this.authRepository.changePassword(user._id.toString(), hashedPass);
      return true;
    }

    const same = await bcrypt.compare(newPassword, user.password as string);

    if (same) {
      BadRequestError('New password cannot be the same as the old password');
    }

    await this.authRepository.changePassword(user._id.toString(), hashedPass);

    return true;
  }

  async refreshAccessToken(
    incomingRefreshToken: string,
  ): Promise<{ tokens: AuthTokens; userId: string }> {
    const payload = this.jwtService.verifyRefreshToken(incomingRefreshToken);
    if (!payload) throw UnauthorizedError('Invalid refresh token');

    const user = await this.authRepository.findById(payload._id);
    if (!user)
      throw NotFoundError('How did you even get this token? User not found');

    if (user.ban) {
      throw ForbiddenError(
        `Your account has been banned. Due to ${user.banReason} Please contact support.`,
      );
    }

    const tokens = this.issueTokenPair(
      user._id.toString(),
      user.role,
      user.subscription,
    );

    return { tokens, userId: user._id.toString() };
  }

  async logInUser(logInDTO: LoginRequestBody): Promise<LoginSession> {
    const searchUser = await this.authRepository.findByEmail(logInDTO.email);

    if (!searchUser) {
      throw NotFoundError('Invalid email or password');
    }

    if (!searchUser.isVerified) {
      throw UnauthorizedError(
        'Email not verified. Please verify your email before logging in.',
      );
    }

    if (searchUser.ban) {
      throw ForbiddenError(
        `Your account has been banned. Due to ${searchUser.banReason} Please contact support.`,
      );
    }

    if (!searchUser.password) {
      throw NotFoundError(
        'This email is registered with Google Sign-In. Please log in with Google.',
      );
    }

    const isMatch = await bcrypt.compare(
      logInDTO.password,
      searchUser.password as string,
    );

    if (!isMatch) {
      throw NotFoundError('Invalid email or password');
    }

    const { accessToken, refreshToken } = this.issueTokenPair(
      searchUser._id.toString(),
      searchUser.role,
      searchUser.subscription,
    );

    const userDetails = AuthMapper.toUserCredientialsResponse(searchUser);

    return {
      tokens: { accessToken, refreshToken },
      userDetails,
    };
  }

  async verifyEmail(token: string): Promise<Boolean> {
    try {
      const payload = this.jwtService.verifyJWTForEmails(token);

      const user = await this.authRepository.findById(payload!._id);

      if (!user) {
        throw NotFoundError('User not found');
      }

      if (user.isVerified) {
        return true;
      }

      await this.authRepository.verifyEmail(user._id.toString());
      return true;
    } catch (error) {
      throw UnauthorizedError('Invalid or expired token');
    }
  }

  sendGoogleVerificationEmail(data: SendGoogleVerificationCode) {
    return this.googleService.sendGoogleVerificationEmail(data);
  }

  resendGoogleVerificationEmail(token: string) {
    return this.googleService.resendGoogleVerificationEmail(token);
  }

  verifyGoogleSignInCode(token: string, code: string) {
    return this.googleService.verifyGoogleSignInCode(token, code);
  }

  completeGoogleSignUp(body: GoogleCompleteSignUpBody) {
    return this.googleService.completeGoogleSignUp(body);
  }

  issueTokenPair(
    userId: string,
    role: string,
    subscription: unknown,
  ): AuthTokens {
    return {
      accessToken: this.jwtService.createJWT(userId, role, subscription),
      refreshToken: this.jwtService.createRefreshToken(userId),
    };
  }

  decryptAccessToken(token: string): JWTPayload {
    const payload = JWTService.verifyJWTForMiddleware(token);
    if (!payload) throw UnauthorizedError('Invalid token');

    return payload;
  }

  issueIncompleteToken(payload: {
    googleId: string;
    email: string;
    displayName: string;
  }): string {
    return this.jwtService.signIncomplete(payload);
  }

  createQRCodeForDesktopLogin() {
    return this.qrService.createQRCodeForDesktopLogin();
  }

  pollQRCodeForLogin(qrCode: string) {
    return this.qrService.pollQRCodeForLogin(qrCode);
  }

  approveDesktopLogin(
    qrCode: string,
    userId: string,
    role: string,
    subscription: unknown,
  ) {
    return this.qrService.approveDesktopLogin(
      qrCode,
      userId,
      role,
      subscription,
    );
  }

  deleteAcount = async (
    userId: string,
    paymentInfo: PaymentInfo,
  ): Promise<void> => {
    if (paymentInfo.subscriptionType !== 'free') {
      throw ForbiddenError(
        'You cannot delete your account without canceling your subscription first. Please cancel your subscription first.',
      );
    }

    await this.deleteUserWithCleanup(userId);
  };

  async deleteUserWithCleanup(userId: string): Promise<void> {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw NotFoundError('User not found');
    }

    if (user.stripeCustomerId) {
      await paymentController.removeStripeCustomer(user.stripeCustomerId);
    }

    await this.authRepository.deleteUser(userId);

    emailService.sendDeletedAccount(user.displayName, user.email);
  }
}
