import bcrypt from 'bcrypt';
import {
  NotFoundError,
  ResourceAlreadyExists,
  UnauthorizedError,
} from '../../shared/errors/responseErrors';
import { AuthRepository } from './auth.repository';
import JWTService from '../../shared/abstractions/jwt';
import logger from '../../shared/logger/logger';

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

export type GoogleCompleteSignUpBody = {
  incompleteToken: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female';
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

  async refreshAccessToken(incomingRefreshToken: string): Promise<string> {
    const payload = this.jwtService.verifyRefreshToken(incomingRefreshToken);
    if (!payload) throw UnauthorizedError('Invalid refresh token');

    const user = await this.authRepository.findById(payload._id);
    if (!user) throw UnauthorizedError('Session expired, please log in again');

    const newAccessToken = this.jwtService.createJWT(
      user._id.toString(),
      user.role,
      user.subscription,
    );

    return newAccessToken;
  }

  async logInUser(logInDTO: logInDTO): Promise<AuthTokens> {
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
      throw UnauthorizedError(
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

    const accessToken = this.jwtService.createJWT(
      searchUser._id.toString(),
      searchUser.role,
      searchUser.subscription as any,
    );

    const refreshToken = this.jwtService.createRefreshToken(
      searchUser._id.toString(),
    );

    return {
      accessToken,
      refreshToken,
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

    // Race condition guard: user registered between the two steps
    const alreadyExists = await this.authRepository.findByEmail(payload.email);
    if (alreadyExists) {
      return {
        accessToken: this.jwtService.createJWT(
          alreadyExists._id.toString(),
          alreadyExists.role,
          alreadyExists.subscription,
        ),
        refreshToken: this.jwtService.createRefreshToken(
          alreadyExists._id.toString(),
        ),
      };
    }

    const newUser = await this.authRepository.createWithGoogle({
      googleId: payload.googleId,
      email: payload.email,
      displayName: payload.displayName,
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
