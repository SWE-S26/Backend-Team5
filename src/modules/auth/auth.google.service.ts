import {
  GoneError,
  NotFoundError,
  ResourceAlreadyExists,
  UnauthorizedError,
} from '../../shared/errors/responseErrors';
import { AuthTokens } from './dtos/auth.response';
import { AuthRepository } from './auth.repository';
import JWTService from '../../shared/abstractions/jwt.service';
import { redisCacher } from '../../shared/abstractions/redis/redisCacher';
import emailService from '../../shared/abstractions/email/email.service';
import { GoogleCompleteSignUpBody } from './dtos/auth.request.body';

export type SendGoogleVerificationCode = {
  userId: string;
  role: string;
  subscription: unknown;
  email: string;
  displayName: string;
  googleId: string;
};

export class AuthGoogleService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JWTService,
  ) {}

  async sendGoogleVerificationEmail(
    data: SendGoogleVerificationCode,
  ): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const TTL_SECONDS = 300;

    await redisCacher.set(`google-signin:${data.userId}`, code, TTL_SECONDS);

    await emailService.sendGoogleSignInVerificationCode(
      data.displayName,
      data.email,
      code,
    );

    const pendingToken = this.jwtService.signPending({
      userId: data.userId,
      role: data.role,
      subscription: data.subscription,
      googleId: data.googleId,
    });

    return pendingToken;
  }

  async resendGoogleVerificationEmail(pendingToken: string): Promise<void> {
    const payload = this.jwtService.verifyPending(pendingToken);

    if (!payload) throw UnauthorizedError('Invalid token');

    const code = await redisCacher.get<string>(
      `google-signin:${payload.userId}`,
    );

    if (!code) {
      throw GoneError(
        'Verification code expired. Please sign in with Google again.',
      );
    }

    const user = await this.authRepository.findById(payload.userId);
    if (!user) throw NotFoundError('User not found');

    await emailService.sendGoogleSignInVerificationCode(
      user.displayName,
      user.email,
      code,
    );
  }

  async verifyGoogleSignInCode(
    pendingToken: string,
    code: string,
  ): Promise<AuthTokens> {
    const payload = this.jwtService.verifyPending(pendingToken);

    const storedCode = await redisCacher.get<string>(
      `google-signin:${payload.userId}`,
    );

    if (!storedCode || storedCode !== code) {
      throw UnauthorizedError('Invalid or expired verification code');
    }

    await redisCacher.delete(`google-signin:${payload.userId}`);

    await this.authRepository.linkGoogleId(payload.userId, payload.googleId);

    return {
      accessToken: this.jwtService.createJWT(
        payload.userId,
        payload.role,
        payload.subscription,
      ),
      refreshToken: this.jwtService.createRefreshToken(payload.userId),
    };
  }

  async completeGoogleSignUp(
    body: GoogleCompleteSignUpBody,
  ): Promise<AuthTokens> {
    const payload = this.jwtService.verifyIncomplete(body.incompleteToken);

    const alreadyExists = await this.authRepository.findByEmail(payload.email);
    if (alreadyExists) {
      throw ResourceAlreadyExists(
        'User already exists. Please login normally.',
      );
    }

    const finalDisplayName = body.displayName || payload.displayName;

    const newUser = await this.authRepository.createWithGoogle({
      googleId: payload.googleId,
      email: payload.email,
      displayName: finalDisplayName,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
    });

    return {
      accessToken: this.jwtService.createJWT(
        newUser._id.toString(),
        newUser.role,
        newUser.subscription,
      ),
      refreshToken: this.jwtService.createRefreshToken(newUser._id.toString()),
    };
  }
}
