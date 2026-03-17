import type {} from 'jest';
import JWTService from '../../../src/shared/abstractions/jwt';

// ── stable mock references — never invalidated ────────────────────────────────
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('../../../src/shared/logger/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../../src/shared/errors/responseErrors', () => ({
  GoneError: jest.fn(),
  UnauthorizedError: jest.fn((msg: string) => new Error(msg)),
}));

import * as jwtLib from 'jsonwebtoken';
const mockSign = jwtLib.sign as jest.Mock;
const mockVerify = jwtLib.verify as jest.Mock;

// ── constants ─────────────────────────────────────────────────────────────────
const FAKE_SECRET = 'test-secret';
const FAKE_REFRESH_SECRET = 'test-refresh-secret';
const FAKE_TOKEN = 'fake.jwt.token';
const FAKE_USER_ID = 'user123';
const FAKE_ROLE = 'Listener/Artist';
const FAKE_SUBSCRIPTION = { plan: 'free' };
const FAKE_GOOGLE_ID = 'google456';

describe('JWTService', () => {
  let service: JWTService;

  beforeEach(() => {
    jest.clearAllMocks(); // resets call counts only — references stay valid

    process.env.JWT_SECRET = FAKE_SECRET;
    process.env.REFRESH_JWT_SECRET = FAKE_REFRESH_SECRET;

    mockSign.mockReturnValue(FAKE_TOKEN);
    mockVerify.mockReturnValue({});

    service = new JWTService();
  });

  // ── createJWT ──────────────────────────────────────────────────────────────
  describe('createJWT', () => {
    it('should call jwt.sign with correct payload and secret', () => {
      const token = service.createJWT(
        FAKE_USER_ID,
        FAKE_ROLE,
        FAKE_SUBSCRIPTION,
      );

      expect(mockSign).toHaveBeenCalledWith(
        { _id: FAKE_USER_ID, role: FAKE_ROLE, paymentInfo: FAKE_SUBSCRIPTION },
        FAKE_SECRET,
        { expiresIn: '1h' },
      );
      expect(token).toBe(FAKE_TOKEN);
    });
  });

  // ── createRefreshToken ─────────────────────────────────────────────────────
  describe('createRefreshToken', () => {
    it('should call jwt.sign with _id and refresh secret', () => {
      const token = service.createRefreshToken(FAKE_USER_ID);

      expect(mockSign).toHaveBeenCalledWith(
        { _id: FAKE_USER_ID },
        FAKE_REFRESH_SECRET,
        { expiresIn: '7d' },
      );
      expect(token).toBe(FAKE_TOKEN);
    });
  });

  // ── verifyRefreshToken ─────────────────────────────────────────────────────
  describe('verifyRefreshToken', () => {
    it('should return the decoded payload on success', () => {
      const fakePayload = { _id: FAKE_USER_ID };
      mockVerify.mockReturnValue(fakePayload);

      const result = service.verifyRefreshToken(FAKE_TOKEN);

      expect(mockVerify).toHaveBeenCalledWith(FAKE_TOKEN, FAKE_REFRESH_SECRET);
      expect(result).toEqual(fakePayload);
    });

    it('should return null and log error when token is invalid', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const logger = require('../../../src/shared/logger/logger');
      const result = service.verifyRefreshToken('bad.token');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Refresh token verification failed'),
      );
    });
  });

  // ── createJWTForEmails ─────────────────────────────────────────────────────
  describe('createJWTForEmails', () => {
    it('should sign with _id payload and 1h expiry', () => {
      const token = service.createJWTForEmails(FAKE_USER_ID);

      expect(mockSign).toHaveBeenCalledWith(
        { _id: FAKE_USER_ID },
        FAKE_SECRET,
        { expiresIn: '1h' },
      );
      expect(token).toBe(FAKE_TOKEN);
    });
  });

  // ── verifyJWTForEmails ─────────────────────────────────────────────────────
  describe('verifyJWTForEmails', () => {
    it('should return the decoded payload on success', () => {
      const fakePayload = { _id: FAKE_USER_ID };
      mockVerify.mockReturnValue(fakePayload);

      const result = service.verifyJWTForEmails(FAKE_TOKEN);

      expect(mockVerify).toHaveBeenCalledWith(FAKE_TOKEN, FAKE_SECRET);
      expect(result).toEqual(fakePayload);
    });

    it('should call GoneError and log when token is invalid', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('expired');
      });

      const {
        GoneError,
      } = require('../../../src/shared/errors/responseErrors');
      const logger = require('../../../src/shared/logger/logger');

      service.verifyJWTForEmails('expired.token');

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('JWT verification failed'),
      );
      expect(GoneError).toHaveBeenCalledWith('Link Expired');
    });
  });

  // ── generateQrCode ─────────────────────────────────────────────────────────
  describe('generateQrCode', () => {
    it('should sign with qrCode payload and 5m expiry', () => {
      const randomString = 'qr_abc123';
      const token = service.generateQrCode(randomString);

      expect(mockSign).toHaveBeenCalledWith(
        { qrCode: randomString },
        FAKE_SECRET,
        { expiresIn: '5m' },
      );
      expect(token).toBe(FAKE_TOKEN);
    });
  });

  // ── signPending ────────────────────────────────────────────────────────────
  describe('signPending', () => {
    it('should sign the full pending payload with 5m expiry', () => {
      const pendingPayload = {
        userId: FAKE_USER_ID,
        role: FAKE_ROLE,
        subscription: FAKE_SUBSCRIPTION,
        googleId: FAKE_GOOGLE_ID,
      };

      const token = service.signPending(pendingPayload);

      expect(mockSign).toHaveBeenCalledWith(pendingPayload, FAKE_SECRET, {
        expiresIn: '5m',
      });
      expect(token).toBe(FAKE_TOKEN);
    });
  });

  // ── verifyPending ──────────────────────────────────────────────────────────
  describe('verifyPending', () => {
    it('should return decoded pending payload on success', () => {
      const fakePayload = {
        userId: FAKE_USER_ID,
        role: FAKE_ROLE,
        subscription: FAKE_SUBSCRIPTION,
        googleId: FAKE_GOOGLE_ID,
      };
      mockVerify.mockReturnValue(fakePayload);

      const result = service.verifyPending(FAKE_TOKEN);

      expect(mockVerify).toHaveBeenCalledWith(FAKE_TOKEN, FAKE_SECRET);
      expect(result).toEqual(fakePayload);
    });

    it('should throw and log when token is invalid', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('expired');
      });

      const {
        UnauthorizedError,
      } = require('../../../src/shared/errors/responseErrors');
      const logger = require('../../../src/shared/logger/logger');

      expect(() => service.verifyPending('bad.token')).toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Pending token verification failed'),
      );
      expect(UnauthorizedError).toHaveBeenCalledWith(
        'Verification session expired, please sign in again',
      );
    });
  });

  // ── signIncomplete ─────────────────────────────────────────────────────────
  describe('signIncomplete', () => {
    it('should sign googleId, email, displayName with 15m expiry', () => {
      const incompletePayload = {
        googleId: FAKE_GOOGLE_ID,
        email: 'user@example.com',
        displayName: 'John Doe',
      };

      const token = service.signIncomplete(incompletePayload);

      expect(mockSign).toHaveBeenCalledWith(incompletePayload, FAKE_SECRET, {
        expiresIn: '15m',
      });
      expect(token).toBe(FAKE_TOKEN);
    });
  });

  // ── verifyIncomplete ───────────────────────────────────────────────────────
  describe('verifyIncomplete', () => {
    it('should return decoded incomplete payload on success', () => {
      const fakePayload = {
        googleId: FAKE_GOOGLE_ID,
        email: 'user@example.com',
        displayName: 'John Doe',
      };
      mockVerify.mockReturnValue(fakePayload);

      const result = service.verifyIncomplete(FAKE_TOKEN);

      expect(mockVerify).toHaveBeenCalledWith(FAKE_TOKEN, FAKE_SECRET);
      expect(result).toEqual(fakePayload);
    });

    it('should throw and log when token is invalid', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('expired');
      });

      const {
        UnauthorizedError,
      } = require('../../../src/shared/errors/responseErrors');
      const logger = require('../../../src/shared/logger/logger');

      expect(() => service.verifyIncomplete('bad.token')).toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Incomplete token verification failed'),
      );
      expect(UnauthorizedError).toHaveBeenCalledWith(
        'Incomplete signup token is invalid or expired',
      );
    });
  });

  // ── verifyJWTForMiddleware (static) ────────────────────────────────────────
  describe('verifyJWTForMiddleware', () => {
    it('should return decoded JWTPayload on success', () => {
      const fakePayload = {
        _id: FAKE_USER_ID,
        role: FAKE_ROLE,
        paymentInfo: FAKE_SUBSCRIPTION,
      };
      mockVerify.mockReturnValue(fakePayload);

      const result = JWTService.verifyJWTForMiddleware(FAKE_TOKEN);

      expect(mockVerify).toHaveBeenCalledWith(FAKE_TOKEN, FAKE_SECRET);
      expect(result).toEqual(fakePayload);
    });

    it('should log and return undefined when token is invalid', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('invalid');
      });

      const logger = require('../../../src/shared/logger/logger');
      const result = JWTService.verifyJWTForMiddleware('bad.token');

      expect(result).toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('JWT verification failed'),
      );
    });
  });
});
