import bcrypt from 'bcrypt';
import crypto from 'crypto';
import {
  ForbiddenError,
  GoneError,
  NotFoundError,
  ResourceAlreadyExists,
  UnauthorizedError,
} from '../../shared/errors/responseErrors';
import { LoginResponse } from './dtos/auth.response';
import { AuthRepository } from './auth.repository';
import JWTService from '../../shared/abstractions/jwt';
import logger from '../../shared/logger/logger';
import { redisCacher } from '../../shared/abstractions/redis/redisCacher';
import emailService from '../../shared/abstractions/email/EmailService';
import { AuthMapper } from './dtos/auth.mapper';

type newUserDTO = {
  email: string;
  password: string;
  displayName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female';
};

type logInDTO = {
  email: string;
  password: string;
};

type QRSession = {
  status: 'pending' | 'verified';
  userId: string | null;
  role: string | null;
  subscription: unknown | null;
};

type LoginSession = {
  tokens: AuthTokens;
  userDetails: LoginResponse;
};

const QR_PREFIX = 'qr-login:';
const QR_TTL_SECONDS = 120; // 2 minutes initial
const QR_EXTEND_SECONDS = 180; // +3 minutes on approval

export type GoogleCompleteSignUpBody = {
  incompleteToken: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female';
};

export type InitiateGoogleSignInDTO = {
  userId: string;
  role: string;
  subscription: unknown;
  email: string;
  displayName: string;
  googleId: string;
};

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private readonly jwtService: JWTService;
  private readonly authRepository: AuthRepository;

  constructor() {
    this.jwtService = new JWTService();
    this.authRepository = new AuthRepository();
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

  async registerNewUser(newUserDTO: newUserDTO): Promise<Boolean> {
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
    try {
      const user = await this.authRepository.findById(payload!._id);

      if (!user) {
        throw NotFoundError('User not found');
      }

      const hashedPass = await this.hashPassowrd(newPassword);
      await this.authRepository.changePassword(user._id.toString(), hashedPass);

      return true;
    } catch (error) {
      logger.error(`Failed to reset password with token: ${error}`);
      throw new Error('Failed to reset password');
    }
  }

  async refreshAccessToken(
    incomingRefreshToken: string,
  ): Promise<{ tokens: AuthTokens; userId: string }> {
    const payload = this.jwtService.verifyRefreshToken(incomingRefreshToken);
    if (!payload) throw UnauthorizedError('Invalid refresh token');

    const user = await this.authRepository.findById(payload._id);
    if (!user)
      throw NotFoundError('How did you even get this token? User not found');

    const tokens = this.issueTokenPair(
      user._id.toString(),
      user.role,
      user.subscription,
    );

    return { tokens, userId: user._id.toString() };
  }

  async logInUser(logInDTO: logInDTO): Promise<LoginSession> {
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

  async initiateGoogleSignIn(data: InitiateGoogleSignInDTO): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const TTL_SECONDS = 300; // 5 minutes

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

    redisCacher.delete(`google-signin:${payload.userId}`);

    this.authRepository.linkGoogleId(payload.userId, payload.googleId);

    const tokens = this.issueTokenPair(
      payload.userId,
      payload.role,
      payload.subscription,
    );

    return tokens;
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

  issueIncompleteToken(payload: {
    googleId: string;
    email: string;
    displayName: string;
  }): string {
    return this.jwtService.signIncomplete(payload);
  }

  async completeGoogleSignUp(
    body: GoogleCompleteSignUpBody,
  ): Promise<AuthTokens> {
    const payload = this.jwtService.verifyIncomplete(body.incompleteToken);

    // ! Race condition guard: user registered between the two steps
    const alreadyExists = await this.authRepository.findByEmail(payload.email);
    if (alreadyExists) {
      throw ResourceAlreadyExists(
        'This user is logged in normally, sign in with google again, please.',
      );
    }

    const newUser = await this.authRepository.createWithGoogle({
      googleId: payload.googleId,
      email: payload.email,
      displayName: payload.displayName,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
    });

    const tokens = this.issueTokenPair(
      newUser._id.toString(),
      newUser.role,
      newUser.subscription,
    );

    return tokens;
  }

  createQRCodeForDesktopLogin = async (): Promise<{
    qrCode: string;
    expiresIn: number;
  }> => {
    const qrCode = `qr_${crypto.randomBytes(16).toString('hex')}`;

    const session: QRSession = {
      status: 'pending',
      userId: null,
      role: null,
      subscription: null,
    };

    await redisCacher.set<QRSession>(
      `${QR_PREFIX}${qrCode}`,
      session,
      QR_TTL_SECONDS,
    );

    return { qrCode, expiresIn: QR_TTL_SECONDS };
  };

  pollQRCodeForLogin = async (qrCode: string): Promise<LoginSession | null> => {
    const session = await redisCacher.get<QRSession>(`${QR_PREFIX}${qrCode}`);

    if (!session) {
      throw GoneError('QR code has expired. Please generate a new one.');
    }

    if (session.status === 'pending') {
      return null;
    }

    await redisCacher.delete(`${QR_PREFIX}${qrCode}`);

    const tokens = this.issueTokenPair(
      session.userId!,
      session.role!,
      session.subscription,
    );

    const user = await this.authRepository.findById(session.userId!);
    if (user?.ban) {
      throw UnauthorizedError(
        `Your account has been banned. Due to ${user.banReason} Please contact support.`,
      );
    }

    const userDetails = AuthMapper.toUserCredientialsResponse(user!);

    return { tokens, userDetails };
  };

  approveDesktopLogin = async (
    qrCode: string,
    userId: string,
    role: string,
    subscription: unknown,
  ): Promise<void> => {
    const session = await redisCacher.get<QRSession>(`${QR_PREFIX}${qrCode}`);

    if (!session) {
      throw GoneError('QR code has expired. Please generate a new one.');
    }

    if (session.status === 'verified') {
      return;
    }

    const updatedSession: QRSession = {
      status: 'verified',
      userId,
      role,
      subscription,
    };

    await redisCacher.set<QRSession>(
      `${QR_PREFIX}${qrCode}`,
      updatedSession,
      QR_EXTEND_SECONDS,
    );
  };
}
