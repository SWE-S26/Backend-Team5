import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { NextFunction, Request, Response } from 'express';
import emailService from '../../../src/shared/abstractions/email/EmailService';
import { LoginResponse } from '../../../src/modules/auth/dtos/auth.response';
import { JwtPayload } from 'jsonwebtoken';
import passport from '../../../src/modules/auth/auth.utils';
import SecureParams from '../../../src/shared/abstractions/security.service';
import { access } from 'node:fs';
jest.mock('../../../src/shared/abstractions/security.service');
jest.mock('passport', () => ({
  authenticate: jest.fn(),
  use: jest.fn(),
}));

jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../src/modules/auth/auth.service');
jest.mock('../../../src/modules/auth/auth.utils', () => ({
  __esModule: true,
  default: {
    authenticate: jest.fn(),
  },
}));

let authController: AuthController;
let mockReq: Partial<Request>;
let mockRes: Partial<Response>;

const fakeLoginResponse: LoginResponse = {
  id: '507f1f77bcf86cd799439011',
  displayName: 'John Doe',
  role: 'Listener',
  profileLink: 'https://example.com/johndoe',
  profileImg: {
    imgLink: 'https://example.com/profile.jpg',
    publicId: 'profile_public_id_123',
  },
  subscription: {
    subscriptionType: 'free',
    quota: {
      unlimited: false,
      usedSeconds: 0,
    },
  },
};

const mockTokens = {
  accessToken: 'fake_access_token',
  refreshToken: 'fake_refresh_token',
};

describe('AuthController : checkEmailExists', () => {
  beforeEach(() => {
    authController = new AuthController();
    mockRes = {
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return exists: true when email exists', async () => {
    mockReq = {
      body: { email: 'test@mail.com' },
      query: {},
      params: {},
    };

    (AuthService.prototype.doesEmailExists as jest.Mock).mockResolvedValue(
      true,
    );

    await authController.checkEmailExists(
      mockReq as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Email Checked Sucessfully',
      data: { exists: true },
    });
  });

  it('should return exists: false when email does not exist', async () => {
    mockReq = {
      body: { email: 'unknown@mail.com' },
      query: {},
      params: {},
    };

    (AuthService.prototype.doesEmailExists as jest.Mock).mockResolvedValue(
      false,
    );

    await authController.checkEmailExists(
      mockReq as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Email Checked Sucessfully',
      data: { exists: false },
    });
  });

  it('should call doesEmailExists with correct email', async () => {
    mockReq = {
      body: { email: 'test@mail.com' },
      query: {},
      params: {},
    };

    (AuthService.prototype.doesEmailExists as jest.Mock).mockResolvedValue(
      true,
    );

    await authController.checkEmailExists(
      mockReq as Request,
      mockRes as Response,
    );

    expect(AuthService.prototype.doesEmailExists).toHaveBeenCalledWith(
      'test@mail.com',
    );
  });

  it('should throw when request validation fails', async () => {
    mockReq = {
      body: { email: 'not-a-valid-email' },
      query: {},
      params: {},
    };

    await expect(
      authController.checkEmailExists(mockReq as Request, mockRes as Response),
    ).rejects.toThrow();
  });

  it('should throw when service throws', async () => {
    mockReq = {
      body: { email: 'test@mail.com' },
      query: {},
      params: {},
    };

    (AuthService.prototype.doesEmailExists as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      authController.checkEmailExists(mockReq as Request, mockRes as Response),
    ).rejects.toThrow('DB is down');
  });
});

describe('AuthController : registerUser', () => {
  beforeEach(() => {
    authController = new AuthController();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {
      email: 'test@mail.com',
      password: 'Password123!',
      displayName: 'John Doe',
      dateOfBirth: new Date('1995-01-01'),
      gender: 'Male',
    },
    query: {},
    params: {},
  };

  it('should return 201 when user is registered successfully', async () => {
    (AuthService.prototype.registerNewUser as jest.Mock).mockResolvedValue(
      true,
    );
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    jest
      .spyOn(emailService, 'sendVerifyAccountLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.registerUser(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User Signed Up Sucessfully',
    });
  });

  it('should throw when registerNewUser returns false', async () => {
    (AuthService.prototype.registerNewUser as jest.Mock).mockResolvedValue(
      false,
    );

    await expect(
      authController.registerUser(mockReq as Request, mockRes as Response),
    ).rejects.toThrow('User Registration Failed');
  });

  it('should call registerNewUser with correct params', async () => {
    (AuthService.prototype.registerNewUser as jest.Mock).mockResolvedValue(
      true,
    );
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    jest
      .spyOn(emailService, 'sendVerifyAccountLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.registerUser(mockReq as Request, mockRes as Response);

    expect(AuthService.prototype.registerNewUser).toHaveBeenCalledWith(
      mockReq.body,
    );
  });

  it('should call createEmailVerificationToken with correct email', async () => {
    (AuthService.prototype.registerNewUser as jest.Mock).mockResolvedValue(
      true,
    );
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    jest
      .spyOn(emailService, 'sendVerifyAccountLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.registerUser(mockReq as Request, mockRes as Response);

    expect(
      AuthService.prototype.createEmailVerificationToken,
    ).toHaveBeenCalledWith('test@mail.com');
  });

  it('should call sendVerifyAccountLink with the correct arguments', async () => {
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    (AuthService.prototype.findByEmail as jest.Mock).mockResolvedValue({
      displayName: 'John Doe',
    });
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('fake_token');
    const emailSpy = jest
      .spyOn(emailService, 'sendVerifyAccountLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.resendVerificationEmail(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(emailSpy).toHaveBeenCalledWith(
      'John Doe',
      'test@mail.com',
      expect.stringContaining('fake_token'),
    );
  });

  it('should include the token and /verify-email path in the verify link', async () => {
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    (AuthService.prototype.findByEmail as jest.Mock).mockResolvedValue({
      displayName: 'John Doe',
    });
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('fake_token');
    const emailSpy = jest
      .spyOn(emailService, 'sendVerifyAccountLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.resendVerificationEmail(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    const verifyLink: string = emailSpy.mock.calls[0][2];
    expect(verifyLink).toContain('fake_token');
    expect(verifyLink).toContain('/verify-email');
  });

  it('should throw when request validation fails', async () => {
    const invalidReq = {
      body: { email: 'not-valid' },
      query: {},
      params: {},
    };

    await expect(
      authController.registerUser(invalidReq as Request, mockRes as Response),
    ).rejects.toThrow();
  });

  it('should throw when service throws', async () => {
    (AuthService.prototype.registerNewUser as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      authController.registerUser(mockReq as Request, mockRes as Response),
    ).rejects.toThrow('DB is down');
  });
});

describe('AuthController : resendVerificationEmail', () => {
  let authController: AuthController;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    authController = new AuthController();
    mockRes = { json: jest.fn() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  const mockReq = {
    body: { email: 'test@mail.com' },
    query: {},
    params: {},
    headers: {},
  };

  it('should return success message when verification email is resent', async () => {
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    (AuthService.prototype.findByEmail as jest.Mock).mockResolvedValue({
      displayName: 'John Doe',
    });
    jest
      .spyOn(emailService, 'sendVerifyAccountLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.resendVerificationEmail(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Verification email resent successfully',
    });
  });

  it('should call createEmailVerificationToken with the correct email', async () => {
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    (AuthService.prototype.findByEmail as jest.Mock).mockResolvedValue({
      displayName: 'John Doe',
    });
    jest
      .spyOn(emailService, 'sendVerifyAccountLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.resendVerificationEmail(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(
      AuthService.prototype.createEmailVerificationToken,
    ).toHaveBeenCalledWith('test@mail.com');
  });

  it('should call findByEmail with the correct email', async () => {
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    (AuthService.prototype.findByEmail as jest.Mock).mockResolvedValue({
      displayName: 'John Doe',
    });
    jest
      .spyOn(emailService, 'sendVerifyAccountLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.resendVerificationEmail(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(AuthService.prototype.findByEmail).toHaveBeenCalledWith(
      'test@mail.com',
    );
  });

  it('should call sendVerifyAccountLink with the correct arguments', async () => {
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    (AuthService.prototype.findByEmail as jest.Mock).mockResolvedValue({
      displayName: 'John Doe',
    });
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('fake_token');
    const emailSpy = jest
      .spyOn(emailService, 'sendVerifyAccountLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.resendVerificationEmail(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(emailSpy).toHaveBeenCalledWith(
      'John Doe',
      'test@mail.com',
      expect.stringContaining('fake_token'),
    );
  });

  it('should include the token and /verify-email path in the verify link', async () => {
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    (AuthService.prototype.findByEmail as jest.Mock).mockResolvedValue({
      displayName: 'John Doe',
    });
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('fake_token');
    const emailSpy = jest
      .spyOn(emailService, 'sendVerifyAccountLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.resendVerificationEmail(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    const verifyLink: string = emailSpy.mock.calls[0][2];
    expect(verifyLink).toContain('fake_token');
    expect(verifyLink).toContain('/verify-email');
  });

  it('should throw when request validation fails', async () => {
    const invalidReq = {
      body: { email: 'not-a-valid-email' },
      query: {},
      params: {},
      headers: {},
    };

    await expect(
      authController.resendVerificationEmail(
        invalidReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow();
  });

  it('should throw when createEmailVerificationToken throws', async () => {
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockRejectedValue(new Error('User not found'));

    await expect(
      authController.resendVerificationEmail(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('User not found');
  });

  it('should throw when findByEmail throws', async () => {
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    (AuthService.prototype.findByEmail as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      authController.resendVerificationEmail(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('DB is down');
  });
});

describe('AuthController : logInUser', () => {
  const mockBody = {
    email: 'test@mail.com',
    password: 'Password123!',
  };

  const mockTokens = {
    accessToken: 'fake_access_token',
    refreshToken: 'fake_refresh_token',
  };

  beforeEach(() => {
    authController = new AuthController();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should redirect with tokens in URL when client is Android', async () => {
    const androidReq = {
      body: mockBody,
      query: { client: 'Android' },
      params: {},
      headers: {},
    };

    (AuthService.prototype.logInUser as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userDetails: fakeLoginResponse,
    });

    await authController.logInUser(
      androidReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.redirect).toHaveBeenCalledWith(
      expect.stringContaining('accessToken=fake_access_token'),
    );
    expect(mockRes.redirect).toHaveBeenCalledWith(
      expect.stringContaining('refreshToken=fake_refresh_token'),
    );
    expect(mockRes.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/cross-callback'),
    );
  });

  it('should not call sendTokenResponse when client is Android', async () => {
    const androidReq = {
      body: mockBody,
      query: { client: 'Android' },
      params: {},
      headers: {},
    };

    (AuthService.prototype.logInUser as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userDetails: fakeLoginResponse,
    });

    await authController.logInUser(
      androidReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.cookie).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return tokens in body for mobile devices', async () => {
    const mobileReq = {
      body: mockBody,
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS)' },
    };

    (AuthService.prototype.logInUser as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userDetails: fakeLoginResponse,
    });

    await authController.logInUser(
      mobileReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Authenticated successfully',
      data: {
        accessToken: 'fake_access_token',
        refreshToken: 'fake_refresh_token',
        user: fakeLoginResponse,
      },
    });
  });

  it('should not set cookies for mobile devices', async () => {
    const mobileReq = {
      body: mockBody,
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (Android 11)' },
    };

    (AuthService.prototype.logInUser as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userDetails: fakeLoginResponse,
    });

    await authController.logInUser(
      mobileReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.cookie).not.toHaveBeenCalled();
  });

  it('should call logInUser service with correct params', async () => {
    const req = {
      body: mockBody,
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
    };

    (AuthService.prototype.logInUser as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userDetails: fakeLoginResponse,
    });

    await authController.logInUser(
      req as unknown as Request,
      mockRes as Response,
    );

    expect(AuthService.prototype.logInUser).toHaveBeenCalledWith(mockBody);
  });

  it('should throw when request validation fails', async () => {
    const invalidReq = {
      body: { email: 'not-valid' },
      query: {},
      params: {},
      headers: {},
    };

    await expect(
      authController.logInUser(
        invalidReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow();
  });

  it('should throw when service throws', async () => {
    const req = {
      body: mockBody,
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
    };

    (AuthService.prototype.logInUser as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      authController.logInUser(req as unknown as Request, mockRes as Response),
    ).rejects.toThrow('DB is down');
  });
});

describe('AuthController : verifyEmail', () => {
  beforeEach(() => {
    authController = new AuthController();
    mockRes = {
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: { token: 'fake_token' },
    params: {},
    headers: {},
  };

  it('should return success message when email is verified', async () => {
    jest.spyOn(SecureParams, 'decrypt').mockReturnValue('fake_token');
    (AuthService.prototype.verifyEmail as jest.Mock).mockResolvedValue(true);

    await authController.verifyEmail(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Email Verified Successfully',
    });
  });

  it('should throw when service returns false', async () => {
    jest.spyOn(SecureParams, 'decrypt').mockReturnValue('fake_token');
    (AuthService.prototype.verifyEmail as jest.Mock).mockResolvedValue(false);

    await expect(
      authController.verifyEmail(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Email Verification Failed');
  });

  it('should call verifyEmail service with correct token', async () => {
    jest.spyOn(SecureParams, 'decrypt').mockReturnValue('fake_token');
    (AuthService.prototype.verifyEmail as jest.Mock).mockResolvedValue(true);

    await authController.verifyEmail(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(AuthService.prototype.verifyEmail).toHaveBeenCalledWith(
      'fake_token',
    );
  });

  it('should throw when request validation fails', async () => {
    const invalidReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
    };

    await expect(
      authController.verifyEmail(
        invalidReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow();
  });

  it('should throw when service throws', async () => {
    jest.spyOn(SecureParams, 'decrypt').mockReturnValue('fake_token');
    (AuthService.prototype.verifyEmail as jest.Mock).mockRejectedValue(
      new Error('Invalid or expired token'),
    );

    await expect(
      authController.verifyEmail(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Invalid or expired token');
  });
});

describe('AuthController : refreshToken', () => {
  const mockTokens = {
    accessToken: 'new_access_token',
    refreshToken: 'new_refresh_token',
  };

  beforeEach(() => {
    authController = new AuthController();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should read token from Authorization header for mobile', async () => {
    const mobileReq = {
      body: {},
      query: {},
      params: {},
      headers: {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS)',
        authorization: 'Bearer fake_refresh_token',
      },
      cookies: {},
    };

    (AuthService.prototype.refreshAccessToken as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userId: '507f1f77bcf86cd799439011',
    });
    (AuthService.prototype.getUserIntialDetails as jest.Mock).mockResolvedValue(
      fakeLoginResponse,
    );

    await authController.refreshToken(
      mobileReq as unknown as Request,
      mockRes as Response,
    );

    expect(AuthService.prototype.refreshAccessToken).toHaveBeenCalledWith(
      'fake_refresh_token',
    );
  });

  it('should read token from cookies for web', async () => {
    const webReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
      cookies: { refreshToken: 'fake_refresh_token' },
    };

    (AuthService.prototype.refreshAccessToken as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userId: '507f1f77bcf86cd799439011',
    });
    (AuthService.prototype.getUserIntialDetails as jest.Mock).mockResolvedValue(
      fakeLoginResponse,
    );

    await authController.refreshToken(
      webReq as unknown as Request,
      mockRes as Response,
    );

    expect(AuthService.prototype.refreshAccessToken).toHaveBeenCalledWith(
      'fake_refresh_token',
    );
  });

  it('should throw when Authorization header is missing for mobile', async () => {
    const mobileReq = {
      body: {},
      query: {},
      params: {},
      headers: {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS)',
      },
      cookies: {},
    };

    await expect(
      authController.refreshToken(
        mobileReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Refresh token is required');
  });

  it('should throw when refresh token cookie is missing for web', async () => {
    const webReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
      cookies: {},
    };

    await expect(
      authController.refreshToken(
        webReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Refresh token is required');
  });

  it('should return tokens in body for mobile', async () => {
    const mobileReq = {
      body: {},
      query: {},
      params: {},
      headers: {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS)',
        authorization: 'Bearer fake_refresh_token',
      },
      cookies: {},
    };

    (AuthService.prototype.refreshAccessToken as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userId: '507f1f77bcf86cd799439011',
    });
    (AuthService.prototype.getUserIntialDetails as jest.Mock).mockResolvedValue(
      fakeLoginResponse,
    );

    await authController.refreshToken(
      mobileReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.cookie).not.toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Authenticated successfully',
      data: {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        user: fakeLoginResponse,
      },
    });
  });

  it('should set cookies and return user for web', async () => {
    const webReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
      cookies: { refreshToken: 'fake_refresh_token' },
    };

    (AuthService.prototype.refreshAccessToken as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userId: '507f1f77bcf86cd799439011',
    });
    (AuthService.prototype.getUserIntialDetails as jest.Mock).mockResolvedValue(
      fakeLoginResponse,
    );

    await authController.refreshToken(
      webReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.cookie).toHaveBeenCalledWith(
      'accessToken',
      'new_access_token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'new_refresh_token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Authenticated successfully',
      data: {
        user: fakeLoginResponse,
        refreshToken: 'new_refresh_token',
        accessToken: 'new_access_token',
      },
    });
  });

  it('should call getUserIntialDetails with correct userId', async () => {
    const webReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
      cookies: { refreshToken: 'fake_refresh_token' },
    };

    (AuthService.prototype.refreshAccessToken as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userId: '507f1f77bcf86cd799439011',
    });
    (AuthService.prototype.getUserIntialDetails as jest.Mock).mockResolvedValue(
      fakeLoginResponse,
    );

    await authController.refreshToken(
      webReq as unknown as Request,
      mockRes as Response,
    );

    expect(AuthService.prototype.getUserIntialDetails).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
  });

  it('should throw when refreshAccessToken service throws', async () => {
    const webReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
      cookies: { refreshToken: 'fake_refresh_token' },
    };

    (AuthService.prototype.refreshAccessToken as jest.Mock).mockRejectedValue(
      new Error('Invalid refresh token'),
    );

    await expect(
      authController.refreshToken(
        webReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Invalid refresh token');
  });
});

describe('AuthController : forgotPassword', () => {
  beforeEach(() => {
    authController = new AuthController();
    mockRes = {
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: { email: 'test@mail.com' },
    query: {},
    params: {},
    headers: {},
  };

  it('should return success message when email is sent', async () => {
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('fake_token');
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockResolvedValue({ token: 'fake_token', userName: 'John Doe' });
    jest
      .spyOn(emailService, 'sendResetPassowordLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.forgotPassword(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Password reset email sent successfully',
    });
  });

  it('should call createPasswordResetToken with correct email', async () => {
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('fake_token');
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockResolvedValue({ token: 'fake_token', userName: 'John Doe' });
    jest
      .spyOn(emailService, 'sendResetPassowordLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.forgotPassword(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(AuthService.prototype.createPasswordResetToken).toHaveBeenCalledWith(
      'test@mail.com',
    );
  });

  it('should call sendResetPasswordLink with correct args', async () => {
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('fake_token');
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockResolvedValue({ token: 'fake_token', userName: 'John Doe' });
    const emailSpy = jest
      .spyOn(emailService, 'sendResetPassowordLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.forgotPassword(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(emailSpy).toHaveBeenCalledWith(
      'John Doe',
      'test@mail.com',
      expect.stringContaining('fake_token'),
    );
  });

  it('should include correct path in resetLink', async () => {
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('fake_token');
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockResolvedValue({ token: 'fake_token', userName: 'John Doe' });
    const emailSpy = jest
      .spyOn(emailService, 'sendResetPassowordLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.forgotPassword(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    const resetLink: string = emailSpy.mock.calls[0][2];
    expect(resetLink).toContain('fake_token');
    expect(resetLink).toContain('/reset-password');
  });

  it('should throw generic error when emailService throws', async () => {
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('fake_token');
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockResolvedValue({ token: 'fake_token', userName: 'John Doe' });
    jest
      .spyOn(emailService, 'sendResetPassowordLink')
      .mockRejectedValue(new Error('SMTP error'));

    await expect(
      authController.forgotPassword(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Failed to send password reset link');
  });

  it('should not propagate original error from emailService', async () => {
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('fake_token');
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockResolvedValue({ token: 'fake_token', userName: 'John Doe' });
    jest
      .spyOn(emailService, 'sendResetPassowordLink')
      .mockRejectedValue(new Error('SMTP error'));

    await expect(
      authController.forgotPassword(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.not.toThrow('SMTP error');
  });

  it('should throw when request validation fails', async () => {
    const invalidReq = {
      body: { email: 'not-valid' },
      query: {},
      params: {},
      headers: {},
    };

    await expect(
      authController.forgotPassword(
        invalidReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow();
  });

  it('should throw when createPasswordResetToken throws', async () => {
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockRejectedValue(new Error('User not found'));

    await expect(
      authController.forgotPassword(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('User not found');
  });
});

describe('AuthController : resetPassword', () => {
  beforeEach(() => {
    authController = new AuthController();
    mockRes = {
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {
      token: 'fake_token',
      newPassword: 'Password123!',
    },
    query: {},
    params: {},
    headers: {},
  };

  it('should return success message when password is reset', async () => {
    jest.spyOn(SecureParams, 'decrypt').mockReturnValue('fake_token');
    (
      AuthService.prototype.resetPasswordWithToken as jest.Mock
    ).mockResolvedValue(true);

    await authController.resetPassword(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Password reset successfully',
    });
  });

  it('should call resetPasswordWithToken with correct args', async () => {
    jest.spyOn(SecureParams, 'decrypt').mockReturnValue('fake_token');
    (
      AuthService.prototype.resetPasswordWithToken as jest.Mock
    ).mockResolvedValue(true);

    await authController.resetPassword(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(AuthService.prototype.resetPasswordWithToken).toHaveBeenCalledWith(
      'fake_token',
      'Password123!',
    );
  });

  it('should throw when service returns false', async () => {
    jest.spyOn(SecureParams, 'decrypt').mockReturnValue('fake_token');
    (
      AuthService.prototype.resetPasswordWithToken as jest.Mock
    ).mockResolvedValue(false);

    await expect(
      authController.resetPassword(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Failed to reset password');
  });

  it('should throw when request validation fails', async () => {
    const invalidReq = {
      body: { token: 'fake_token' },
      query: {},
      params: {},
      headers: {},
    };

    await expect(
      authController.resetPassword(
        invalidReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow();
  });

  it('should throw when service throws', async () => {
    jest.spyOn(SecureParams, 'decrypt').mockReturnValue('fake_token');
    (
      AuthService.prototype.resetPasswordWithToken as jest.Mock
    ).mockRejectedValue(new Error('Token expired'));

    await expect(
      authController.resetPassword(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Token expired');
  });
});

describe('AuthController : logout', () => {
  beforeEach(() => {
    authController = new AuthController();
    mockRes = {
      json: jest.fn(),
      clearCookie: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return null tokens for mobile', async () => {
    const mobileReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS)' },
      cookies: {},
    };

    await authController.logout(
      mobileReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User Logged Out Sucessfully',
      data: {
        acessToken: null,
        refreshToken: null,
      },
    });
  });

  it('should not clear cookies for mobile', async () => {
    const mobileReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (Android 11)' },
      cookies: {},
    };

    await authController.logout(
      mobileReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.clearCookie).not.toHaveBeenCalled();
  });

  it('should clear both cookies with correct options for web', async () => {
    const webReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
      cookies: {},
    };

    await authController.logout(
      webReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      'accessToken',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('should return success message for web', async () => {
    const webReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
      cookies: {},
    };

    await authController.logout(
      webReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User Logged Out Successfully',
    });
  });

  it('should not return null tokens for web', async () => {
    const webReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
      cookies: {},
    };

    await authController.logout(
      webReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.anything() }),
    );
  });
});

describe('AuthController : googleRedirect', () => {
  let mockNext: jest.Mock;
  let mockMiddleware: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    authController = new AuthController();
    mockRes = { json: jest.fn() };
    mockNext = jest.fn();
    mockMiddleware = jest.fn();
  });

  it('should call passport.authenticate with the google strategy', () => {
    (passport.authenticate as jest.Mock).mockReturnValue(mockMiddleware);

    authController.googleRedirect(
      { body: {}, query: {}, params: {}, headers: {} } as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(passport.authenticate).toHaveBeenCalledWith(
      'google',
      expect.anything(),
    );
  });

  it('should call passport.authenticate with profile and email scopes and session false', () => {
    (passport.authenticate as jest.Mock).mockReturnValue(mockMiddleware);

    authController.googleRedirect(
      { body: {}, query: {}, params: {}, headers: {} } as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(passport.authenticate).toHaveBeenCalledWith(
      'google',
      expect.objectContaining({
        scope: ['profile', 'email'],
        session: false,
      }),
    );
  });

  it('should invoke the middleware returned by passport.authenticate with req, res, next', () => {
    (passport.authenticate as jest.Mock).mockReturnValue(mockMiddleware);

    const mockReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
    };

    authController.googleRedirect(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockMiddleware).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
  });

  it('should pass client query param as state when it is a string', () => {
    (passport.authenticate as jest.Mock).mockReturnValue(mockMiddleware);

    authController.googleRedirect(
      {
        body: {},
        query: { client: 'Android' },
        params: {},
        headers: {},
      } as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(passport.authenticate).toHaveBeenCalledWith(
      'google',
      expect.objectContaining({ state: 'Android' }),
    );
  });

  it('should pass undefined as state when client query param is absent', () => {
    (passport.authenticate as jest.Mock).mockReturnValue(mockMiddleware);

    authController.googleRedirect(
      { body: {}, query: {}, params: {}, headers: {} } as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(passport.authenticate).toHaveBeenCalledWith(
      'google',
      expect.objectContaining({ state: undefined }),
    );
  });

  it('should pass undefined as state when client query param is not a string', () => {
    (passport.authenticate as jest.Mock).mockReturnValue(mockMiddleware);

    authController.googleRedirect(
      {
        body: {},
        query: { client: ['Android', 'iOS'] },
        params: {},
        headers: {},
      } as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(passport.authenticate).toHaveBeenCalledWith(
      'google',
      expect.objectContaining({ state: undefined }),
    );
  });
});

describe('AuthController : googleCallback', () => {
  let mockNext: jest.Mock;

  beforeEach(() => {
    authController = new AuthController();
    mockRes = {
      json: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  const baseReq = {
    body: {},
    query: { code: 'auth_code', state: 'state_value' },
    params: {},
    headers: {},
  };

  /**
   * Makes passport.authenticate invoke its inner async callback with
   * the provided (err, payload) pair, routing any thrown error through next().
   */
  function mockPassportCallback(
    err: Error | null,
    payload: object | false,
  ): void {
    (passport.authenticate as jest.Mock).mockImplementation(
      (_strategy: string, _options: object, callback: Function) =>
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            await callback(err, payload);
          } catch (e) {
            next(e);
          }
        },
    );
  }

  it('should throw BadRequestError when request validation fails', () => {
    const invalidReq = { body: {}, query: {}, params: {}, headers: {} };

    expect(() => {
      authController.googleCallback(
        invalidReq as unknown as Request,
        mockRes as Response,
        mockNext,
      );
    }).toThrow('Invalid request data');

    expect(passport.authenticate).not.toHaveBeenCalled();
  });

  it('should call next with the error when passport returns an error', async () => {
    const authError = new Error('OAuth failed');
    mockPassportCallback(authError, false);

    await authController.googleCallback(
      baseReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(authError);
  });

  it('should call next with ForbiddenError when passport returns no payload', async () => {
    mockPassportCallback(null, false);

    await authController.googleCallback(
      baseReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Google authentication failed'),
      }),
    );
  });

  it('should call issueTokenPair with correct args for a returning google user', async () => {
    const returningPayload = {
      status: 'returning_google',
      userId: '507f1f77bcf86cd799439011',
      role: 'Listener',
      subscription: { subscriptionType: 'free' },
      client: undefined,
    };
    mockPassportCallback(null, returningPayload);

    (AuthService.prototype.issueTokenPair as jest.Mock).mockReturnValue(
      mockTokens,
    );
    jest
      .spyOn(authController as any, 'sendGoogleTokenResponse')
      .mockImplementation(() => {});

    await authController.googleCallback(
      baseReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(AuthService.prototype.issueTokenPair).toHaveBeenCalledWith(
      returningPayload.userId,
      returningPayload.role,
      returningPayload.subscription,
    );
  });

  it('should call sendGoogleTokenResponse with correct tokens for a returning google user', async () => {
    const returningPayload = {
      status: 'returning_google',
      userId: '507f1f77bcf86cd799439011',
      role: 'Listener',
      subscription: { subscriptionType: 'free' },
      client: undefined,
    };
    mockPassportCallback(null, returningPayload);

    (AuthService.prototype.issueTokenPair as jest.Mock).mockReturnValue(
      mockTokens,
    );
    const sendGoogleTokenSpy = jest
      .spyOn(authController as any, 'sendGoogleTokenResponse')
      .mockImplementation(() => {});

    await authController.googleCallback(
      baseReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(sendGoogleTokenSpy).toHaveBeenCalledWith(
      expect.anything(),
      mockRes,
      mockTokens.accessToken,
      mockTokens.refreshToken,
      returningPayload.client,
    );
  });

  it('should call issueIncompleteToken with correct args for a new google user', async () => {
    const newPayload = {
      status: 'new',
      googleId: 'google_123',
      email: 'new@mail.com',
      displayName: 'New User',
      client: undefined,
    };
    mockPassportCallback(null, newPayload);

    (AuthService.prototype.issueIncompleteToken as jest.Mock).mockReturnValue(
      'incomplete_token_value',
    );
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('encrypted_incomplete');

    await authController.googleCallback(
      baseReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(AuthService.prototype.issueIncompleteToken).toHaveBeenCalledWith({
      googleId: newPayload.googleId,
      email: newPayload.email,
      displayName: newPayload.displayName,
    });
  });

  it('should redirect to /oauth-continue-details with encrypted incompleteToken for a new google user', async () => {
    const newPayload = {
      status: 'new',
      googleId: 'google_123',
      email: 'new@mail.com',
      displayName: 'New User',
      client: undefined,
    };
    mockPassportCallback(null, newPayload);

    (AuthService.prototype.issueIncompleteToken as jest.Mock).mockReturnValue(
      'incomplete_token_value',
    );
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('encrypted_incomplete');

    await authController.googleCallback(
      baseReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    const redirectUrl: string = (mockRes.redirect as jest.Mock).mock
      .calls[0][0];
    expect(redirectUrl).toContain('/oauth-continue-details');
    expect(redirectUrl).toContain('incompleteToken=encrypted_incomplete');
  });

  it('should include client in redirect URL for new google user when client is present', async () => {
    const newPayload = {
      status: 'new',
      googleId: 'google_123',
      email: 'new@mail.com',
      displayName: 'New User',
      client: 'Android',
    };
    mockPassportCallback(null, newPayload);

    (AuthService.prototype.issueIncompleteToken as jest.Mock).mockReturnValue(
      'incomplete_token_value',
    );
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('encrypted_incomplete');

    await authController.googleCallback(
      baseReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    const redirectUrl: string = (mockRes.redirect as jest.Mock).mock
      .calls[0][0];
    expect(redirectUrl).toContain('client=Android');
  });

  it('should call initiateGoogleSignIn with correct args for an existing google user', async () => {
    const existingPayload = {
      status: 'existing_google',
      userId: '507f1f77bcf86cd799439011',
      role: 'Listener',
      subscription: { subscriptionType: 'free' },
      email: 'existing@mail.com',
      displayName: 'Existing User',
      googleId: 'google_existing_123',
      client: undefined,
    };
    mockPassportCallback(null, existingPayload);

    (AuthService.prototype.initiateGoogleSignIn as jest.Mock).mockResolvedValue(
      'pending_token_value',
    );
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('encrypted_pending');

    await authController.googleCallback(
      baseReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(AuthService.prototype.initiateGoogleSignIn).toHaveBeenCalledWith({
      userId: existingPayload.userId,
      role: existingPayload.role,
      subscription: existingPayload.subscription,
      email: existingPayload.email,
      displayName: existingPayload.displayName,
      googleId: existingPayload.googleId,
    });
  });

  it('should redirect to /verify-code with encrypted pendingToken for an existing google user', async () => {
    const existingPayload = {
      status: 'existing_google',
      userId: '507f1f77bcf86cd799439011',
      role: 'Listener',
      subscription: { subscriptionType: 'free' },
      email: 'existing@mail.com',
      displayName: 'Existing User',
      googleId: 'google_existing_123',
      client: undefined,
    };
    mockPassportCallback(null, existingPayload);

    (AuthService.prototype.initiateGoogleSignIn as jest.Mock).mockResolvedValue(
      'pending_token_value',
    );
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('encrypted_pending');

    await authController.googleCallback(
      baseReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    const redirectUrl: string = (mockRes.redirect as jest.Mock).mock
      .calls[0][0];
    expect(redirectUrl).toContain('/verify-code');
    expect(redirectUrl).toContain('pendingToken=encrypted_pending');
  });

  it('should include client in redirect URL for existing google user when client is present', async () => {
    const existingPayload = {
      status: 'existing_google',
      userId: '507f1f77bcf86cd799439011',
      role: 'Listener',
      subscription: { subscriptionType: 'free' },
      email: 'existing@mail.com',
      displayName: 'Existing User',
      googleId: 'google_existing_123',
      client: 'Android',
    };
    mockPassportCallback(null, existingPayload);

    (AuthService.prototype.initiateGoogleSignIn as jest.Mock).mockResolvedValue(
      'pending_token_value',
    );
    jest.spyOn(SecureParams, 'encrypt').mockReturnValue('encrypted_pending');

    await authController.googleCallback(
      baseReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    const redirectUrl: string = (mockRes.redirect as jest.Mock).mock
      .calls[0][0];
    expect(redirectUrl).toContain('client=Android');
  });
});

describe('AuthController : googleCompleteSignUp', () => {
  let mockNext: jest.Mock;

  beforeEach(() => {
    authController = new AuthController();
    mockRes = {
      json: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {
      incompleteToken: 'encrypted_incomplete_token',
      username: 'johndoe',
      dateOfBirth: new Date('1995-01-01').toISOString(),
      gender: 'Male',
    },
    query: {},
    params: {},
    headers: {},
  };

  it('should throw BadRequestError when request validation fails', async () => {
    const invalidReq = { body: {}, query: {}, params: {}, headers: {} };

    await expect(
      authController.googleCompleteSignUp(
        invalidReq as unknown as Request,
        mockRes as Response,
        mockNext,
      ),
    ).rejects.toThrow('Invalid request data');

    expect(AuthService.prototype.completeGoogleSignUp).not.toHaveBeenCalled();
  });

  it('should decrypt the incompleteToken before calling the service', async () => {
    jest
      .spyOn(SecureParams, 'decrypt')
      .mockReturnValue('decrypted_incomplete_token');
    (AuthService.prototype.completeGoogleSignUp as jest.Mock).mockResolvedValue(
      {
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      },
    );
    jest
      .spyOn(authController as any, 'sendGoogleTokenResponse')
      .mockImplementation(() => {});

    await authController.googleCompleteSignUp(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(SecureParams.decrypt).toHaveBeenCalledWith(
      'encrypted_incomplete_token',
    );
  });

  it('should call completeGoogleSignUp with decrypted token, dateOfBirth and gender', async () => {
    jest
      .spyOn(SecureParams, 'decrypt')
      .mockReturnValue('decrypted_incomplete_token');
    (AuthService.prototype.completeGoogleSignUp as jest.Mock).mockResolvedValue(
      {
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      },
    );
    jest
      .spyOn(authController as any, 'sendGoogleTokenResponse')
      .mockImplementation(() => {});

    await authController.googleCompleteSignUp(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(AuthService.prototype.completeGoogleSignUp).toHaveBeenCalledWith({
      incompleteToken: 'decrypted_incomplete_token',
      dateOfBirth: mockReq.body.dateOfBirth,
      gender: mockReq.body.gender,
    });
  });

  it('should NOT pass username to completeGoogleSignUp', async () => {
    jest
      .spyOn(SecureParams, 'decrypt')
      .mockReturnValue('decrypted_incomplete_token');
    (AuthService.prototype.completeGoogleSignUp as jest.Mock).mockResolvedValue(
      {
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      },
    );
    jest
      .spyOn(authController as any, 'sendGoogleTokenResponse')
      .mockImplementation(() => {});

    await authController.googleCompleteSignUp(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(AuthService.prototype.completeGoogleSignUp).not.toHaveBeenCalledWith(
      expect.objectContaining({ username: expect.anything() }),
    );
  });

  it('should call sendGoogleTokenResponse with the tokens from the service', async () => {
    jest
      .spyOn(SecureParams, 'decrypt')
      .mockReturnValue('decrypted_incomplete_token');
    (AuthService.prototype.completeGoogleSignUp as jest.Mock).mockResolvedValue(
      {
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      },
    );
    const sendGoogleTokenSpy = jest
      .spyOn(authController as any, 'sendGoogleTokenResponse')
      .mockImplementation(() => {});

    await authController.googleCompleteSignUp(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(sendGoogleTokenSpy).toHaveBeenCalledWith(
      expect.anything(),
      mockRes,
      mockTokens.accessToken,
      mockTokens.refreshToken,
    );
  });

  it('should not call next on successful sign-up completion', async () => {
    jest
      .spyOn(SecureParams, 'decrypt')
      .mockReturnValue('decrypted_incomplete_token');
    (AuthService.prototype.completeGoogleSignUp as jest.Mock).mockResolvedValue(
      {
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      },
    );
    jest
      .spyOn(authController as any, 'sendGoogleTokenResponse')
      .mockImplementation(() => {});

    await authController.googleCompleteSignUp(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next with the error when service throws', async () => {
    jest
      .spyOn(SecureParams, 'decrypt')
      .mockReturnValue('decrypted_incomplete_token');
    const serviceError = new Error('Incomplete token expired');
    (AuthService.prototype.completeGoogleSignUp as jest.Mock).mockRejectedValue(
      serviceError,
    );

    await authController.googleCompleteSignUp(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(serviceError);
  });

  it('should call next with the error when SecureParams.decrypt throws', async () => {
    const decryptError = new Error('Malformed token');
    jest.spyOn(SecureParams, 'decrypt').mockImplementation(() => {
      throw decryptError;
    });

    await authController.googleCompleteSignUp(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(decryptError);
  });
});

describe('AuthController : createQRCode', () => {
  let authController: AuthController;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    AuthService.prototype.createQRCodeForDesktopLogin = jest.fn();
    authController = new AuthController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: {},
    params: {},
    headers: {},
  };

  it('should return a success message and the pendingToken', async () => {
    (
      AuthService.prototype.createQRCodeForDesktopLogin as jest.Mock
    ).mockResolvedValue('qr_pending_token');

    await authController.createQRCode(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'QR Code generated successfully',
      pendingToken: 'qr_pending_token',
    });
  });

  it('should call createQRCodeForDesktopLogin once', async () => {
    (
      AuthService.prototype.createQRCodeForDesktopLogin as jest.Mock
    ).mockResolvedValue('qr_pending_token');

    await authController.createQRCode(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(
      AuthService.prototype.createQRCodeForDesktopLogin,
    ).toHaveBeenCalledTimes(1);
  });

  it('should throw when service throws', async () => {
    (
      AuthService.prototype.createQRCodeForDesktopLogin as jest.Mock
    ).mockRejectedValue(new Error('Cache unavailable'));

    await expect(
      authController.createQRCode(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Cache unavailable');
  });
});

describe('AuthController : pollQRCode', () => {
  beforeEach(() => {
    AuthService.prototype.pollQRCodeForLogin = jest.fn();
    authController = new AuthController();
    mockRes = {
      json: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  const baseReq = {
    body: { qrCode: 'fake_qr_code' },
    query: {},
    params: {},
    headers: {},
  };

  it('should call pollQRCodeForLogin with the correct qrCode', async () => {
    (AuthService.prototype.pollQRCodeForLogin as jest.Mock).mockResolvedValue(
      null,
    );

    await authController.pollQRCode(
      baseReq as unknown as Request,
      mockRes as Response,
    );

    expect(AuthService.prototype.pollQRCodeForLogin).toHaveBeenCalledWith(
      'fake_qr_code',
    );
  });

  it('should return "QR Code not yet scanned" message when poll returns falsy', async () => {
    (AuthService.prototype.pollQRCodeForLogin as jest.Mock).mockResolvedValue(
      null,
    );

    await authController.pollQRCode(
      baseReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'QR Code not yet scanned',
    });
  });

  it('should not call sendTokenResponse when poll returns falsy', async () => {
    (AuthService.prototype.pollQRCodeForLogin as jest.Mock).mockResolvedValue(
      null,
    );
    const sendTokenSpy = jest
      .spyOn(authController as any, 'sendTokenResponse')
      .mockImplementation(() => {});

    await authController.pollQRCode(
      baseReq as unknown as Request,
      mockRes as Response,
    );

    expect(sendTokenSpy).not.toHaveBeenCalled();
  });

  it('should call sendTokenResponse with correct args when QR code is approved', async () => {
    const webReq = {
      ...baseReq,
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
    };

    (AuthService.prototype.pollQRCodeForLogin as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userDetails: fakeLoginResponse,
    });
    const sendTokenSpy = jest
      .spyOn(authController as any, 'sendTokenResponse')
      .mockImplementation(() => {});

    await authController.pollQRCode(
      webReq as unknown as Request,
      mockRes as Response,
    );

    expect(sendTokenSpy).toHaveBeenCalledWith(
      expect.anything(),
      mockRes,
      mockTokens.accessToken,
      mockTokens.refreshToken,
      fakeLoginResponse,
    );
  });

  it('should return tokens in body for mobile when QR code is approved', async () => {
    const mobileReq = {
      ...baseReq,
      headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS)' },
    };

    (AuthService.prototype.pollQRCodeForLogin as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userDetails: fakeLoginResponse,
    });

    await authController.pollQRCode(
      mobileReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Authenticated successfully',
      data: {
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        user: fakeLoginResponse,
      },
    });
  });

  it('should not set cookies for mobile when QR code is approved', async () => {
    const mobileReq = {
      ...baseReq,
      headers: { 'user-agent': 'Mozilla/5.0 (Android 11)' },
    };

    (AuthService.prototype.pollQRCodeForLogin as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userDetails: fakeLoginResponse,
    });

    await authController.pollQRCode(
      mobileReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.cookie).not.toHaveBeenCalled();
  });

  it('should set cookies and return user for web when QR code is approved', async () => {
    const webReq = {
      ...baseReq,
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
    };

    (AuthService.prototype.pollQRCodeForLogin as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userDetails: fakeLoginResponse,
    });

    await authController.pollQRCode(
      webReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.cookie).toHaveBeenCalledWith(
      'accessToken',
      mockTokens.accessToken,
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refreshToken',
      mockTokens.refreshToken,
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Authenticated successfully',
      data: {
        user: fakeLoginResponse,
        refreshToken: 'fake_refresh_token',
        accessToken: 'fake_access_token',
      },
    });
  });

  it('should throw when request validation fails', async () => {
    const invalidReq = { body: {}, query: {}, params: {}, headers: {} };

    await expect(
      authController.pollQRCode(
        invalidReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow();
  });

  it('should throw when service throws', async () => {
    (AuthService.prototype.pollQRCodeForLogin as jest.Mock).mockRejectedValue(
      new Error('Cache miss'),
    );

    await expect(
      authController.pollQRCode(
        baseReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Cache miss');
  });
});

describe('AuthController : approveLoginFromMobile', () => {
  const fakeUserInfo: Partial<JwtPayload> = {
    _id: '507f1f77bcf86cd799439011',
    role: 'Listener',
    paymentInfo: {
      subscriptionType: 'free',
      quota: { unlimited: false, usedSeconds: 0 },
    },
  };
  let mockNext: jest.Mock;

  beforeEach(() => {
    AuthService.prototype.approveDesktopLogin = jest.fn();
    authController = new AuthController();
    mockRes = { json: jest.fn() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  const mockReq = {
    body: { qrCode: 'fake_qr_code' },
    query: {},
    params: {},
    headers: {},
    userInfo: fakeUserInfo,
  };

  it('should call approveDesktopLogin with qrCode and correct user info', async () => {
    (AuthService.prototype.approveDesktopLogin as jest.Mock).mockResolvedValue(
      undefined,
    );

    await authController.approveLoginFromMobile(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(AuthService.prototype.approveDesktopLogin).toHaveBeenCalledWith(
      'fake_qr_code',
      fakeUserInfo._id,
      fakeUserInfo.role,
      fakeUserInfo.paymentInfo,
    );
  });

  it('should return success message when login is approved', async () => {
    (AuthService.prototype.approveDesktopLogin as jest.Mock).mockResolvedValue(
      undefined,
    );

    await authController.approveLoginFromMobile(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Login approved successfully',
    });
  });

  it('should not call next on success', async () => {
    (AuthService.prototype.approveDesktopLogin as jest.Mock).mockResolvedValue(
      undefined,
    );

    await authController.approveLoginFromMobile(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should throw when request validation fails', async () => {
    const invalidReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
      userInfo: fakeUserInfo,
    };

    await expect(
      authController.approveLoginFromMobile(
        invalidReq as unknown as Request,
        mockRes as Response,
        mockNext,
      ),
    ).rejects.toThrow();

    expect(AuthService.prototype.approveDesktopLogin).not.toHaveBeenCalled();
  });

  it('should throw when approveDesktopLogin throws', async () => {
    (AuthService.prototype.approveDesktopLogin as jest.Mock).mockRejectedValue(
      new Error('QR code expired'),
    );

    await expect(
      authController.approveLoginFromMobile(
        mockReq as unknown as Request,
        mockRes as Response,
        mockNext,
      ),
    ).rejects.toThrow('QR code expired');
  });
});
