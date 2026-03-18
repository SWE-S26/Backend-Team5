import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { Request, Response } from 'express';
import emailService from '../../../src/shared/abstractions/email/EmailService';
import { LoginResponse } from '../../../src/modules/auth/dtos/auth.response';

jest.mock('../../../src/modules/auth/auth.service');

let authController: AuthController;
let mockReq: Partial<Request>;
let mockRes: Partial<Response>;

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
    expect(verifyLink).toContain('/api/auth/v1/verify-email');
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
    expect(resetLink).toContain('/api/auth/v1/reset-password');
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
