import JWTService from '../../shared/abstractions/jwt.service';
import { AuthRepository } from './auth.repository';
import bcrypt from 'bcrypt';
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
  ResourceAlreadyExists,
  NotFoundError,
} from '../../shared/errors/responseErrors';
import { AuthTokens, LoginSession } from './dtos/auth.response';
import { LoginRequestBody, SignUpRequestBody } from './dtos/auth.request.body';
import { AuthMapper } from './dtos/auth.mapper';
import { paymentController } from '../payment/payment.routes';
import emailService from '../../shared/abstractions/email/email.service';
import { PaymentInfo } from '../../shared/models/models.user';

export class BasicAuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JWTService,
  ) {}

  private async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
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

  async registerNewUser(newUserDTO: SignUpRequestBody): Promise<boolean> {
    const existingUser = await this.authRepository.findByEmail(
      newUserDTO.email,
    );

    if (existingUser) {
      throw ResourceAlreadyExists('Email Already Exists');
    }

    const hashedPass = await this.hashPassword(newUserDTO.password);

    await this.authRepository.create(
      newUserDTO.email,
      hashedPass,
      newUserDTO.displayName,
      newUserDTO.dateOfBirth,
      newUserDTO.gender,
    );

    return true;
  }

  async logInUser(logInDTO: LoginRequestBody): Promise<LoginSession> {
    const user = await this.authRepository.findByEmail(logInDTO.email);

    if (!user) throw NotFoundError('Invalid email or password');

    if (!user.isVerified) {
      throw UnauthorizedError('Email not verified');
    }

    if (user.ban) {
      throw ForbiddenError(`Banned: ${user.banReason}`);
    }

    if (!user.password) {
      throw NotFoundError('Use Google Sign-In');
    }

    const isMatch = await bcrypt.compare(
      logInDTO.password,
      user.password as string,
    );

    if (!isMatch) {
      throw NotFoundError('Invalid email or password');
    }

    const tokens = this.issueTokenPair(
      user._id.toString(),
      user.role,
      user.subscription,
    );

    const userDetails = AuthMapper.toUserCredientialsResponse(user);

    return { tokens, userDetails };
  }

  async createEmailVerificationToken(email: string): Promise<string> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) throw NotFoundError('User not found');

    return this.jwtService.createJWTForEmails(user._id.toString());
  }

  async verifyEmail(token: string): Promise<boolean> {
    try {
      const payload = this.jwtService.verifyJWTForEmails(token);

      const user = await this.authRepository.findById(payload!._id);
      if (!user) throw NotFoundError('User not found');

      if (user.isVerified) return true;

      await this.authRepository.verifyEmail(user._id.toString());
      return true;
    } catch {
      throw UnauthorizedError('Invalid or expired token');
    }
  }

  async createPasswordResetToken(
    email: string,
  ): Promise<{ token: string; userName: string }> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) throw NotFoundError('User not found');

    return {
      token: this.jwtService.createJWTForEmails(user._id.toString()),
      userName: user.displayName as string,
    };
  }

  async resetPasswordWithToken(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    const payload = this.jwtService.verifyJWTForEmails(token);

    const user = await this.authRepository.findByIdForPasswordComparing(
      payload!._id,
    );

    if (!user) throw NotFoundError('User not found');

    const hashedPass = await this.hashPassword(newPassword);

    if (user.password) {
      const same = await bcrypt.compare(newPassword, user.password as string);

      if (same) {
        throw BadRequestError(
          'New password cannot be the same as the old password',
        );
      }
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
    if (!user) throw NotFoundError('User not found');

    if (user.ban) {
      throw ForbiddenError(`Banned: ${user.banReason}`);
    }

    const tokens = this.issueTokenPair(
      user._id.toString(),
      user.role,
      user.subscription,
    );

    return { tokens, userId: user._id.toString() };
  }

  async deleteAccount(userId: string, paymentInfo: PaymentInfo): Promise<void> {
    if (paymentInfo.subscriptionType !== 'free') {
      throw ForbiddenError('Cancel subscription before deleting account');
    }

    await this.deleteUserWithCleanup(userId);
  }

  async deleteUserWithCleanup(userId: string): Promise<void> {
    const user = await this.authRepository.findById(userId);
    if (!user) throw NotFoundError('User not found');

    if (user.stripeCustomerId) {
      await paymentController.removeStripeCustomer(user.stripeCustomerId);
    }

    await this.authRepository.deleteUser(userId);

    emailService.sendDeletedAccount(user.displayName, user.email);
  }
}
