import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';
import logger from '../logger/logger';

class SecureParams {
  private static instance: SecureParams;
  private static readonly ALGORITHM = 'aes-256-gcm';

  private readonly key!: Buffer;

  private constructor() {
    const secret = process.env.REDIRECT_PARAM_SECRET;
    const salt = process.env.REDIRECT_PARAM_SALT;

    if (!secret || !salt) {
      logger.warn(
        `Missing REDIRECT_PARAM_SECRET or REDIRECT_PARAM_SALT environment variables. Redirect parameter encryption will not work.`,
      );

      return;
    }

    this.key = scryptSync(secret, salt, 32);
  }

  /**
   * Singleton accessor
   */
  public static getInstance(): SecureParams {
    if (!SecureParams.instance) {
      SecureParams.instance = new SecureParams();
    }
    return SecureParams.instance;
  }

  encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(SecureParams.ALGORITHM, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
  }

  decrypt(encoded: string): string {
    const buf = Buffer.from(encoded, 'base64url');

    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);

    const decipher = createDecipheriv(SecureParams.ALGORITHM, this.key, iv);

    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }
}

export default SecureParams.getInstance();
