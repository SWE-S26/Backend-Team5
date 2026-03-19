import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { NextFunction, Request, Response } from 'express';
import emailService from '../../../src/shared/abstractions/email/EmailService';
import { LoginResponse } from '../../../src/modules/auth/dtos/auth.response';
import { JwtPayload } from 'jsonwebtoken';
import passport from '../../../src/modules/auth/auth.utils';
jest.mock('../../../src/modules/auth/auth.service');

let authController: AuthController;
let mockReq: Partial<Request>;
let mockRes: Partial<Response>;

const fakeLoginResponse: LoginResponse = {
  id: '507f1f77bcf86cd799439011',
  displayName: 'John Doe',
  role: 'Listener/Artist',
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

  it('should call sendVerifyAccountLink with correct args', async () => {
    (AuthService.prototype.registerNewUser as jest.Mock).mockResolvedValue(
      true,
    );
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    const emailSpy = jest
      .spyOn(emailService, 'sendVerifyAccountLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.registerUser(mockReq as Request, mockRes as Response);

    expect(emailSpy).toHaveBeenCalledWith(
      'John Doe',
      'test@mail.com',
      expect.stringContaining('fake_token'),
    );
  });

  it('should include correct path in verifyLink', async () => {
    (AuthService.prototype.registerNewUser as jest.Mock).mockResolvedValue(
      true,
    );
    (
      AuthService.prototype.createEmailVerificationToken as jest.Mock
    ).mockResolvedValue('fake_token');
    const emailSpy = jest
      .spyOn(emailService, 'sendVerifyAccountLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.registerUser(mockReq as Request, mockRes as Response);

    const verifyLink = emailSpy.mock.calls[0][2];
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
  const mockReq = {
    body: {
      email: 'test@mail.com',
      password: 'Password123!',
    },
    query: {},
    params: {},
    headers: {},
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
    };
    jest.clearAllMocks();
  });

  it('should return tokens in body for mobile devices', async () => {
    const mobileReq = {
      ...mockReq,
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

  it('should set cookies and return user for web devices', async () => {
    const webReq = {
      ...mockReq,
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
    };

    (AuthService.prototype.logInUser as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userDetails: fakeLoginResponse,
    });

    await authController.logInUser(
      webReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.cookie).toHaveBeenCalledWith(
      'accessToken',
      'fake_access_token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'fake_refresh_token',
      expect.objectContaining({ httpOnly: true }),
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Authenticated successfully',
      data: { user: fakeLoginResponse },
    });
  });

  it('should not set cookies for mobile devices', async () => {
    const mobileReq = {
      ...mockReq,
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
    const webReq = {
      ...mockReq,
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
    };

    (AuthService.prototype.logInUser as jest.Mock).mockResolvedValue({
      tokens: mockTokens,
      userDetails: fakeLoginResponse,
    });

    await authController.logInUser(
      webReq as unknown as Request,
      mockRes as Response,
    );

    expect(AuthService.prototype.logInUser).toHaveBeenCalledWith(mockReq.body);
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
    const webReq = {
      ...mockReq,
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' },
    };

    (AuthService.prototype.logInUser as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      authController.logInUser(
        webReq as unknown as Request,
        mockRes as Response,
      ),
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
    (AuthService.prototype.verifyEmail as jest.Mock).mockResolvedValue(false);

    await expect(
      authController.verifyEmail(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Email Verification Failed');
  });

  it('should call verifyEmail service with correct token', async () => {
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

  it('should throw UnauthorizedError when token is missing for mobile', async () => {
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

  it('should throw UnauthorizedError when cookie is missing for web', async () => {
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
      data: { user: fakeLoginResponse },
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

  it('should throw when service throws', async () => {
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
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockResolvedValue({
      token: 'fake_token',
      userName: 'John Doe',
    });
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
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockResolvedValue({
      token: 'fake_token',
      userName: 'John Doe',
    });
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
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockResolvedValue({
      token: 'fake_token',
      userName: 'John Doe',
    });
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
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockResolvedValue({
      token: 'fake_token',
      userName: 'John Doe',
    });
    const emailSpy = jest
      .spyOn(emailService, 'sendResetPassowordLink')
      .mockImplementation(() => Promise.resolve(true));

    await authController.forgotPassword(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    const resetLink = emailSpy.mock.calls[0][2];
    expect(resetLink).toContain('fake_token');
    expect(resetLink).toContain('/reset-password');
  });

  it('should throw generic error when emailService throws', async () => {
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockResolvedValue({
      token: 'fake_token',
      userName: 'John Doe',
    });
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
    (
      AuthService.prototype.createPasswordResetToken as jest.Mock
    ).mockResolvedValue({
      token: 'fake_token',
      userName: 'John Doe',
    });
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

  it('should throw when service returns false', async () => {
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

  it('should call resetPasswordWithToken with correct args', async () => {
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
    (
      AuthService.prototype.resetPasswordWithToken as jest.Mock
    ).mockRejectedValue(new Error('Failed to reset password'));

    await expect(
      authController.resetPassword(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Failed to reset password');
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

  it('should clear cookies for web', async () => {
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
});

describe('AuthController : googleRedirect', () => {
  let authController: AuthController;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let mockMiddleware: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    authController = new AuthController();
    mockRes = { json: jest.fn() };
    mockNext = jest.fn();
    mockMiddleware = jest.fn();
    passport.authenticate = jest.fn();
  });

  const mockReq = {
    body: {},
    query: {},
    params: {},
    headers: {},
  };

  it('should call passport.authenticate with the google strategy', () => {
    (passport.authenticate as jest.Mock).mockResolvedValue(mockMiddleware);

    authController.googleRedirect(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(passport.authenticate).toHaveBeenCalledWith(
      'google',
      expect.anything(),
    );
  });

  it('should call passport.authenticate with profile and email scopes', () => {
    (passport.authenticate as jest.Mock).mockResolvedValue(mockMiddleware);

    authController.googleRedirect(
      mockReq as unknown as Request,
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

  it('should invoke the middleware returned by passport.authenticate', () => {
    (passport.authenticate as jest.Mock).mockResolvedValue(mockMiddleware);

    authController.googleRedirect(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockMiddleware).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
  });
});

// ─── googleCallback ────────────────────────────────────────────────────────────

describe('AuthController : googleCallback', () => {
  let authController: AuthController;
  let mockRes: Partial<Response>;
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
   * Helper: makes passport.authenticate call its inner async callback with
   * the provided (err, payload) pair.
   */
  function mockPassportCallback(
    err: Error | null,
    payload: object | false,
  ): void {
    (passport.authenticate as jest.Mock).mockImplementation(
      (_strategy: string, _options: object, callback: Function) =>
        async (req: Request, res: Response, next: NextFunction) => {
          await callback(err, payload);
        },
    );
  }

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

  it('should issue tokens and redirect to /home for a returning google user', async () => {
    const returningPayload = {
      status: 'returning_google',
      userId: '507f1f77bcf86cd799439011',
      role: 'Listener/Artist',
      subscription: { subscriptionType: 'free' },
    };
    mockPassportCallback(null, returningPayload);

    (AuthService.prototype.getUserIntialDetails as jest.Mock).mockResolvedValue(
      fakeLoginResponse,
    );
    (AuthService.prototype.issueTokenPair as jest.Mock).mockReturnValue(
      mockTokens,
    );

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
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'accessToken',
      mockTokens.accessToken,
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mockRes.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/home'),
    );
  });

  it('should redirect to /oauth-continue-details for a new google user', async () => {
    const newPayload = {
      status: 'new',
      googleId: 'google_123',
      email: 'new@mail.com',
      displayName: 'New User',
    };
    mockPassportCallback(null, newPayload);

    (AuthService.prototype.issueIncompleteToken as jest.Mock).mockReturnValue(
      'incomplete_token_value',
    );

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
    expect(mockRes.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/oauth-continue-details'),
    );
  });

  it('should include incompleteToken, email and displayName in the redirect for new users', async () => {
    const newPayload = {
      status: 'new',
      googleId: 'google_123',
      email: 'new@mail.com',
      displayName: 'New User',
    };
    mockPassportCallback(null, newPayload);

    (AuthService.prototype.issueIncompleteToken as jest.Mock).mockReturnValue(
      'incomplete_token_value',
    );

    await authController.googleCallback(
      baseReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    const redirectUrl: string = (mockRes.redirect as jest.Mock).mock
      .calls[0][0];
    expect(redirectUrl).toContain('incompleteToken=incomplete_token_value');
    expect(redirectUrl).toContain('email=new%40mail.com');
    expect(redirectUrl).toContain('displayName=New+User');
  });

  it('should redirect to /verify-code with pendingToken for an existing user requiring 2FA', async () => {
    const existingPayload = {
      status: 'existing_google',
      userId: '507f1f77bcf86cd799439011',
      role: 'Listener/Artist',
      subscription: { subscriptionType: 'free' },
      email: 'existing@mail.com',
      displayName: 'Existing User',
      googleId: 'google_existing_123',
    };
    mockPassportCallback(null, existingPayload);

    (AuthService.prototype.initiateGoogleSignIn as jest.Mock).mockResolvedValue(
      { pendingToken: 'pending_token_value' },
    );

    await authController.googleCallback(
      baseReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    const redirectUrl: string = (mockRes.redirect as jest.Mock).mock
      .calls[0][0];
    expect(redirectUrl).toContain('/verify-code');
    expect(redirectUrl).toContain('pendingToken=pending_token_value');
  });

  it('should call next with BadRequestError when request validation fails', async () => {
    const invalidReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
    };

    await authController.googleCallback(
      invalidReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});

// ─── googleCompleteSignUp ──────────────────────────────────────────────────────

describe('AuthController : googleCompleteSignUp', () => {
  let authController: AuthController;
  let mockRes: Partial<Response>;
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
      incompleteToken: 'incomplete_token_value',
      username: 'johndoe',
      dateOfBirth: new Date('1995-01-01').toISOString(),
      gender: 'Male',
    },
    query: {},
    params: {},
    headers: {},
  };

  it('should set cookies and redirect on successful sign-up completion', async () => {
    (AuthService.prototype.completeGoogleSignUp as jest.Mock).mockResolvedValue(
      {
        tokens: mockTokens,
        userDetails: fakeLoginResponse,
      },
    );

    await authController.googleCompleteSignUp(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
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
    expect(mockRes.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/home'),
    );
  });

  it('should call completeGoogleSignUp with the request body', async () => {
    (AuthService.prototype.completeGoogleSignUp as jest.Mock).mockResolvedValue(
      {
        tokens: mockTokens,
        userDetails: fakeLoginResponse,
      },
    );

    await authController.googleCompleteSignUp(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(AuthService.prototype.completeGoogleSignUp).toHaveBeenCalledWith(
      mockReq.body,
    );
  });

  it('should include tokens as query params in the redirect URL', async () => {
    (AuthService.prototype.completeGoogleSignUp as jest.Mock).mockResolvedValue(
      {
        tokens: mockTokens,
        userDetails: fakeLoginResponse,
      },
    );

    await authController.googleCompleteSignUp(
      mockReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    const redirectUrl: string = (mockRes.redirect as jest.Mock).mock
      .calls[0][0];
    expect(redirectUrl).toContain(`accessToken=${mockTokens.accessToken}`);
    expect(redirectUrl).toContain(`refreshToken=${mockTokens.refreshToken}`);
  });

  it('should call next with BadRequestError when request validation fails', async () => {
    const invalidReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
    };

    await authController.googleCompleteSignUp(
      invalidReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  it('should call next with the error when service throws', async () => {
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
});

// ─── createQRCode ──────────────────────────────────────────────────────────────

describe('AuthController : createQRCode', () => {
  let authController: AuthController;
  let mockRes: Partial<Response>;

  beforeEach(() => {
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

// ─── pollQRCode ────────────────────────────────────────────────────────────────

describe('AuthController : pollQRCode', () => {
  let authController: AuthController;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    authController = new AuthController();
    mockRes = {
      json: jest.fn(),
      cookie: jest.fn(),
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

  it('should return "not yet scanned" message when poll returns falsy', async () => {
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
      data: { user: fakeLoginResponse },
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

  it('should throw when request validation fails', async () => {
    const invalidReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
    };

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

// ─── approveLoginFromMobile ────────────────────────────────────────────────────

describe('AuthController : approveLoginFromMobile', () => {
  let authController: AuthController;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  const fakeUserInfo: Partial<JwtPayload> = {
    _id: '507f1f77bcf86cd799439011',
    role: 'Listener/Artist',
    paymentInfo: {
      subscriptionType: 'free',
      quota: { unlimited: false, usedSeconds: 0 },
    },
  };

  beforeEach(() => {
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

  it('should call next with BadRequestError when request validation fails', async () => {
    const invalidReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
      userInfo: fakeUserInfo,
    };

    await authController.approveLoginFromMobile(
      invalidReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
    expect(mockRes.json).not.toHaveBeenCalled();
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

  it('should not call json when validation fails', async () => {
    const invalidReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
      userInfo: fakeUserInfo,
    };

    await authController.approveLoginFromMobile(
      invalidReq as unknown as Request,
      mockRes as Response,
      mockNext,
    );

    expect(mockRes.json).not.toHaveBeenCalled();
  });
});
