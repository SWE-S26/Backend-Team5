import jwt, { SignOptions } from 'jsonwebtoken';
import { GoneError, UnauthorizedError } from '../errors/responseErrors';
import logger from '../logger/logger';

export interface JWTPayload {
  _id: string;
  role: string;
  paymentInfo: unknown;
}

export interface EmailVerificationPayload {
  _id: string;
}

declare global {
  namespace Express {
    interface Request {
      userInfo?: JWTPayload;
    }
  }
}

class JWTService {
  private secretKey: string;
  private expiresIn: SignOptions['expiresIn'];

  constructor() {
    this.secretKey = process.env.JWT_SECRET!;
    this.expiresIn = '1h';
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
