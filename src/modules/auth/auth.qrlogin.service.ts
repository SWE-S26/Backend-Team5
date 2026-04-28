import crypto from 'crypto';
import {
  ForbiddenError,
  GoneError,
  NotFoundError,
} from '../../shared/errors/responseErrors';
import { LoginSession } from './dtos/auth.response';
import { AuthRepository } from './auth.repository';
import JWTService from '../../shared/abstractions/jwt.service';
import { redisCacher } from '../../shared/abstractions/redis/redisCacher';
import { AuthMapper } from './dtos/auth.mapper';

type QRSession = {
  status: 'pending' | 'verified';
  userId: string | null;
  role: string | null;
  subscription: unknown | null;
};

export class AuthQRLoginService {
  private readonly QR_PREFIX = 'qr-login:';
  private readonly QR_TTL_SECONDS = 120;
  private readonly QR_EXTEND_SECONDS = 180;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JWTService,
  ) {}

  async createQRCodeForDesktopLogin(): Promise<{
    qrCode: string;
    expiresIn: number;
  }> {
    const qrCode = `qr_${crypto.randomBytes(16).toString('hex')}`;

    const session: QRSession = {
      status: 'pending',
      userId: null,
      role: null,
      subscription: null,
    };

    await redisCacher.set(
      `${this.QR_PREFIX}${qrCode}`,
      session,
      this.QR_TTL_SECONDS,
    );

    return { qrCode, expiresIn: this.QR_TTL_SECONDS };
  }

  async pollQRCodeForLogin(qrCode: string): Promise<LoginSession | null> {
    const session = await redisCacher.get<QRSession>(
      `${this.QR_PREFIX}${qrCode}`,
    );

    if (!session) {
      throw GoneError('QR code expired');
    }

    if (session.status === 'pending') return null;

    await redisCacher.delete(`${this.QR_PREFIX}${qrCode}`);

    const user = await this.authRepository.findById(session.userId!);
    if (!user) throw NotFoundError('User not found');

    if (user.ban) {
      throw ForbiddenError(`User banned: ${user.banReason}`);
    }

    const tokens = {
      accessToken: this.jwtService.createJWT(
        session.userId!,
        session.role!,
        session.subscription,
      ),
      refreshToken: this.jwtService.createRefreshToken(session.userId!),
    };

    const userDetails = AuthMapper.toUserCredientialsResponse(user);

    return { tokens, userDetails };
  }

  async approveDesktopLogin(
    qrCode: string,
    userId: string,
    role: string,
    subscription: unknown,
  ): Promise<void> {
    const session = await redisCacher.get<QRSession>(
      `${this.QR_PREFIX}${qrCode}`,
    );

    if (!session) {
      throw GoneError('QR expired');
    }

    if (session.status === 'verified') return;

    const updatedSession: QRSession = {
      status: 'verified',
      userId,
      role,
      subscription,
    };

    await redisCacher.set(
      `${this.QR_PREFIX}${qrCode}`,
      updatedSession,
      this.QR_EXTEND_SECONDS,
    );
  }
}
