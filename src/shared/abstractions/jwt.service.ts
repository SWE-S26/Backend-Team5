import jwt, { SignOptions } from 'jsonwebtoken';
import { GoneError, UnauthorizedError } from '../errors/responseErrors';
import { PaymentInfo } from '../models/models.user';
import logger from '../logger/logger';

export interface JWTPayload {
  _id: string;
  role: string;
  paymentInfo: PaymentInfo;
}

declare global {
  namespace Express {
    interface Request {
      userInfo?: JWTPayload;
    }
  }
}

interface PendingTokenPayload {
  userId: string;
  role: string;
  subscription: unknown;
  googleId: string;
}

export interface EmailVerificationPayload {
  _id: string;
}

export interface RefreshTokenPayload {
  _id: string;
}

class JWTService {
  private readonly secretKey: string;
  private readonly expiresIn: SignOptions['expiresIn'];
  private readonly refreshSecretKey: string;
  private readonly refreshExpiresIn: SignOptions['expiresIn'];

  constructor() {
    this.secretKey = process.env.JWT_SECRET!;
    this.refreshSecretKey = process.env.REFRESH_JWT_SECRET!;
    this.expiresIn = '1h';
    this.refreshExpiresIn = '7d';
  }

  createJWT(_id: string, role: string, paymentInfo: any): string {
    const payload = {
      _id,
      role,
      paymentInfo,
    };

    const options: SignOptions = {
      expiresIn: this.expiresIn,
    };

    return jwt.sign(payload, this.secretKey, options);
  }

  createRefreshToken(_id: string): string {
    return jwt.sign({ _id }, this.refreshSecretKey, {
      expiresIn: this.refreshExpiresIn,
    });
  }

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(token, this.refreshSecretKey) as RefreshTokenPayload;
    } catch (err) {
      logger.error(`Refresh token verification failed: ${err}`);
      return null;
    }
  }

  createJWTForEmails(_id: string): string {
    const payload = {
      _id,
    };

    const options: SignOptions = {
      expiresIn: '1h',
    };

    return jwt.sign(payload, this.secretKey, options);
  }

  verifyJWTForEmails(token: string): EmailVerificationPayload | undefined {
    try {
      return jwt.verify(
        token,
        process.env.JWT_SECRET!,
      ) as EmailVerificationPayload;
    } catch (err) {
      logger.error(`JWT verification failed: ${err}`);
      GoneError('Link Expired');
    }
  }

  generateQrCode(randomString: string): string {
    return jwt.sign({ qrCode: randomString }, this.secretKey, {
      expiresIn: '5m',
    });
  }

  signPending(payload: PendingTokenPayload): string {
    return jwt.sign(payload, this.secretKey, { expiresIn: '5m' });
  }

  verifyPending(token: string): PendingTokenPayload {
    try {
      return jwt.verify(token, this.secretKey) as PendingTokenPayload;
    } catch (err) {
      logger.error(`Pending token verification failed: ${err}`);
      throw UnauthorizedError(
        'Verification session expired, please sign in again',
      );
    }
  }

  signIncomplete(payload: {
    googleId: string;
    email: string;
    displayName: string;
  }): string {
    return jwt.sign(payload, this.secretKey, { expiresIn: '15m' });
  }

  verifyIncomplete(token: string): {
    googleId: string;
    email: string;
    displayName: string;
  } {
    try {
      return jwt.verify(token, this.secretKey) as {
        googleId: string;
        email: string;
        displayName: string;
      };
    } catch (err) {
      logger.error(`Incomplete token verification failed: ${err}`);
      throw UnauthorizedError('Incomplete signup token is invalid or expired');
    }
  }

  static verifyJWTForMiddleware(token: string): JWTPayload | undefined {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (err) {
      logger.error(`JWT verification failed: ${err}`);
      UnauthorizedError('Unauthorized Access');
    }
  }
}

export default JWTService;
