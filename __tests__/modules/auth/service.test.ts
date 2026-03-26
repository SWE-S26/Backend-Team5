import { describe, it, expect } from '@jest/globals';
import User, { IUser } from '../../../src/shared/models/models.user';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { AuthRepository } from '../../../src/modules/auth/auth.repository';
import { Types } from 'mongoose';
import JWTService from '../../../src/shared/abstractions/jwt';
import { AuthMapper } from '../../../src/modules/auth/dtos/auth.mapper';
import { LoginResponse } from '../../../src/modules/auth/dtos/auth.response';
import bcrypt from 'bcrypt';

jest.mock('../../../src/modules/auth/auth.repository');

let authService: AuthService;

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

type newUserDTO = {
  email: string;
  password: string;
  displayName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female';
};

const mockNewUser: newUserDTO = {
  email: 'test@mail.com',
  password: 'hashed_password',
  displayName: 'John Doe',
  dateOfBirth: new Date('1995-01-01'),
  gender: 'Male',
};

const fakeUser: IUser = {
  _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
  email: 'test@mail.com',
  password: 'hashed_password',
  googleId: 'google_123456',
  role: 'Listener',
  displayName: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  city: 'Cairo',
  country: 'Egypt',
  bio: 'Test bio',
  dateOfBirth: new Date('1995-01-01'),
  gender: 'Male',
  isVerified: true,
  profileImg: {
    imgLink: 'https://example.com/profile.jpg',
    publicId: 'profile_public_id_123',
  },
  bannerImg: {
    imgLink: 'https://example.com/banner.jpg',
    publicId: 'banner_public_id_123',
  },
  socialMediaLinks: [
    {
      name: 'Twitter',
      link: 'https://twitter.com/johndoe',
    },
  ],
  tracks: [new Types.ObjectId('507f1f77bcf86cd799439012')],
  profileLink: 'https://example.com/johndoe',
  links: [
    {
      name: 'Website',
      link: 'https://johndoe.com',
    },
  ],
  supportLink: 'https://example.com/support/johndoe',
  likedPlaylists: [new Types.ObjectId('507f1f77bcf86cd799439013')],
  likedTracks: [new Types.ObjectId('507f1f77bcf86cd799439014')],
  playlists: [new Types.ObjectId('507f1f77bcf86cd799439015')],
  uploads: [new Types.ObjectId('507f1f77bcf86cd799439016')],
  reposts: [
    {
      id: '507f1f77bcf86cd799439017',
      caption: 'Great track!',
      type: 'track',
      timestamp: new Date('2024-01-01'),
    },
  ],
  isPaid: false,
  ban: false,
  banReason: '',
  subscription: {
    subscriptionType: 'free',
    quota: {
      unlimited: false,
      usedSeconds: 0,
      leftSeconds: 3600,
    },
  },
};

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

describe('AuthService : doesEmailExists', () => {
  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return true when user exists', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      'test@email.com',
    );
    const result = await authService.doesEmailExists('test@email.com');
    expect(result).toBe(true);
  });

  it("should return false when user doesn't exists", async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);
    const result = await authService.doesEmailExists('test@email.com');
    expect(result).toBe(false);
  });

  it('should throw an error when DB is down', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(authService.doesEmailExists('test@email.com')).rejects.toThrow(
      'DB is down',
    );
  });
});

describe('AuthService : registerNewUser', () => {
  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return true when user is created', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);
    (AuthRepository.prototype.create as jest.Mock).mockResolvedValue(
      mockNewUser,
    );

    const result = await authService.registerNewUser(mockNewUser);

    expect(result).toBe(true);
  });

  it('should return false because user exists', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      'test@mail.com',
    );

    await expect(authService.registerNewUser(mockNewUser)).rejects.toThrow(
      'Email Already Exists',
    );
  });

  it('should call create with correct params', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);
    (AuthRepository.prototype.create as jest.Mock).mockResolvedValue(
      mockNewUser,
    );

    jest
      .spyOn(authService as any, 'hashPassowrd')
      .mockResolvedValue('hashed_password');

    await authService.registerNewUser(mockNewUser);
    expect(AuthRepository.prototype.create).toHaveBeenCalledWith(
      mockNewUser.email,
      'hashed_password',
      mockNewUser.displayName,
      mockNewUser.dateOfBirth,
      mockNewUser.gender,
    );
  });

  it('should throw generic error when create fails', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);
    (AuthRepository.prototype.create as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(authService.registerNewUser(mockNewUser)).rejects.toThrow(
      'Failed to register new user',
    );
  });

  it('should call hashPassword with plain password', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);
    (AuthRepository.prototype.create as jest.Mock).mockResolvedValue(
      mockNewUser,
    );

    const hashSpy = jest
      .spyOn(authService as any, 'hashPassowrd')
      .mockResolvedValue('hashed_password');

    await authService.registerNewUser(mockNewUser);

    expect(hashSpy).toHaveBeenCalledWith(mockNewUser.password);
  });
});

describe('AuthService : createEmailVerificationToken', () => {
  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return token when user exists', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(JWTService.prototype, 'createJWTForEmails')
      .mockReturnValue('fake_token');

    const result =
      await authService.createEmailVerificationToken('test@mail.com');

    expect(result).toBe('fake_token');
  });

  it('should throw NotFoundError when user does not exist', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.createEmailVerificationToken('test@mail.com'),
    ).rejects.toThrow('User not found');
  });

  it('should call findByEmail with correct email', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(JWTService.prototype, 'createJWTForEmails')
      .mockReturnValue('fake_token');

    await authService.createEmailVerificationToken('test@mail.com');

    expect(AuthRepository.prototype.findByEmail).toHaveBeenCalledWith(
      'test@mail.com',
    );
  });

  it('should call createJWTForEmails with correct user id', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    const jwtSpy = jest
      .spyOn(JWTService.prototype, 'createJWTForEmails')
      .mockReturnValue('fake_token');

    await authService.createEmailVerificationToken('test@mail.com');

    expect(jwtSpy).toHaveBeenCalledWith(fakeUser._id.toString());
  });

  it('should throw when findByEmail throws', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      authService.createEmailVerificationToken('test@mail.com'),
    ).rejects.toThrow('DB is down');
  });
});

describe('AuthService : getUserIntialDetails', () => {
  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return mapped LoginResponse when user exists', async () => {
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(AuthMapper, 'toUserCredientialsResponse')
      .mockReturnValue(fakeLoginResponse);

    const result = await authService.getUserIntialDetails(
      '507f1f77bcf86cd799439011',
    );

    expect(result).toEqual(fakeLoginResponse);
  });

  it('should throw NotFoundError when user does not exist', async () => {
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.getUserIntialDetails('507f1f77bcf86cd799439011'),
    ).rejects.toThrow('User not found');
  });

  it('should call findById with correct userId', async () => {
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(AuthMapper, 'toUserCredientialsResponse')
      .mockReturnValue(fakeLoginResponse);

    await authService.getUserIntialDetails('507f1f77bcf86cd799439011');

    expect(AuthRepository.prototype.findById).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
  });

  it('should call AuthMapper with correct user', async () => {
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    const mapperSpy = jest
      .spyOn(AuthMapper, 'toUserCredientialsResponse')
      .mockReturnValue(fakeLoginResponse);

    await authService.getUserIntialDetails('507f1f77bcf86cd799439011');

    expect(mapperSpy).toHaveBeenCalledWith(fakeUser);
  });

  it('should throw when findById throws', async () => {
    (AuthRepository.prototype.findById as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      authService.getUserIntialDetails('507f1f77bcf86cd799439011'),
    ).rejects.toThrow('DB is down');
  });
});

describe('AuthService : createPasswordResetToken', () => {
  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return token and userName when user exists', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(JWTService.prototype, 'createJWTForEmails')
      .mockReturnValue('fake_token');

    const result = await authService.createPasswordResetToken('test@mail.com');

    expect(result).toEqual({
      token: 'fake_token',
      userName: fakeUser.displayName,
    });
  });

  it('should throw NotFoundError when user does not exist', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.createPasswordResetToken('test@mail.com'),
    ).rejects.toThrow('User not found');
  });

  it('should call findByEmail with correct email', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(JWTService.prototype, 'createJWTForEmails')
      .mockReturnValue('fake_token');

    await authService.createPasswordResetToken('test@mail.com');

    expect(AuthRepository.prototype.findByEmail).toHaveBeenCalledWith(
      'test@mail.com',
    );
  });

  it('should call createJWTForEmails with correct user id', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    const jwtSpy = jest
      .spyOn(JWTService.prototype, 'createJWTForEmails')
      .mockReturnValue('fake_token');

    await authService.createPasswordResetToken('test@mail.com');

    expect(jwtSpy).toHaveBeenCalledWith(fakeUser._id.toString());
  });

  it('should return displayName as userName — not other fields', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(JWTService.prototype, 'createJWTForEmails')
      .mockReturnValue('fake_token');

    const result = await authService.createPasswordResetToken('test@mail.com');

    expect(result.userName).toBe(fakeUser.displayName);
    expect(result.userName).not.toBe(fakeUser.firstName);
    expect(result.userName).not.toBe(fakeUser.email);
  });

  it('should throw when findByEmail throws', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      authService.createPasswordResetToken('test@mail.com'),
    ).rejects.toThrow('DB is down');
  });
});

describe('AuthService : resetPasswordWithToken', () => {
  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return true when password reset succeeds', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(authService as any, 'hashPassowrd')
      .mockResolvedValue('hashed_password');
    (AuthRepository.prototype.changePassword as jest.Mock).mockResolvedValue(
      fakeUser,
    );

    const result = await authService.resetPasswordWithToken(
      'fake_token',
      'new_password',
    );

    expect(result).toBe(true);
  });

  it('should throw generic error when user not found', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.resetPasswordWithToken('fake_token', 'new_password'),
    ).rejects.toThrow('Failed to reset password');
  });

  it('should call verifyJWTForEmails with correct token', async () => {
    const jwtSpy = jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(authService as any, 'hashPassowrd')
      .mockResolvedValue('hashed_password');
    (AuthRepository.prototype.changePassword as jest.Mock).mockResolvedValue(
      fakeUser,
    );

    await authService.resetPasswordWithToken('fake_token', 'new_password');

    expect(jwtSpy).toHaveBeenCalledWith('fake_token');
  });

  it('should call findById with id from token payload', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(authService as any, 'hashPassowrd')
      .mockResolvedValue('hashed_password');
    (AuthRepository.prototype.changePassword as jest.Mock).mockResolvedValue(
      fakeUser,
    );

    await authService.resetPasswordWithToken('fake_token', 'new_password');

    expect(AuthRepository.prototype.findById).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
  });

  it('should call hashPassword with plain new password', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    const hashSpy = jest
      .spyOn(authService as any, 'hashPassowrd')
      .mockResolvedValue('hashed_password');
    (AuthRepository.prototype.changePassword as jest.Mock).mockResolvedValue(
      fakeUser,
    );

    await authService.resetPasswordWithToken('fake_token', 'new_password');

    expect(hashSpy).toHaveBeenCalledWith('new_password');
  });

  it('should call changePassword with hashed password — not plain', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(authService as any, 'hashPassowrd')
      .mockResolvedValue('hashed_password');
    (AuthRepository.prototype.changePassword as jest.Mock).mockResolvedValue(
      fakeUser,
    );

    await authService.resetPasswordWithToken('fake_token', 'new_password');

    const calledWith = (AuthRepository.prototype.changePassword as jest.Mock)
      .mock.calls[0];
    expect(calledWith[1]).toBe('hashed_password');
    expect(calledWith[1]).not.toBe('new_password');
  });

  it('should throw when verifyJWTForEmails throws', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockImplementation(() => {
        throw new Error('invalid token');
      });

    await expect(
      authService.resetPasswordWithToken('fake_token', 'new_password'),
    ).rejects.toThrow('invalid token');
  });

  it('should not propagate original error message', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      authService.resetPasswordWithToken('fake_token', 'new_password'),
    ).rejects.not.toThrow('DB is down');
  });
});

describe('AuthService : refreshAccessToken', () => {
  const fakeTokens: AuthTokens = {
    accessToken: 'fake_access_token',
    refreshToken: 'fake_refresh_token',
  };

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return tokens and userId when valid', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyRefreshToken')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(authService as any, 'issueTokenPair')
      .mockReturnValue(fakeTokens);

    const result = await authService.refreshAccessToken('fake_refresh_token');

    expect(result).toEqual({
      tokens: fakeTokens,
      userId: fakeUser._id.toString(),
    });
  });

  it('should throw UnauthorizedError when payload is null', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyRefreshToken')
      .mockReturnValue(null);

    await expect(
      authService.refreshAccessToken('fake_refresh_token'),
    ).rejects.toThrow('Invalid refresh token');
  });

  it('should throw NotFoundError when user not found', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyRefreshToken')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.refreshAccessToken('fake_refresh_token'),
    ).rejects.toThrow('User not found');
  });

  it('should call verifyRefreshToken with correct token', async () => {
    const jwtSpy = jest
      .spyOn(JWTService.prototype, 'verifyRefreshToken')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(authService as any, 'issueTokenPair')
      .mockReturnValue(fakeTokens);

    await authService.refreshAccessToken('fake_refresh_token');

    expect(jwtSpy).toHaveBeenCalledWith('fake_refresh_token');
  });

  it('should call findById with id from payload', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyRefreshToken')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(authService as any, 'issueTokenPair')
      .mockReturnValue(fakeTokens);

    await authService.refreshAccessToken('fake_refresh_token');

    expect(AuthRepository.prototype.findById).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
  });

  it('should call issueTokenPair with correct user fields', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyRefreshToken')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    const issueSpy = jest
      .spyOn(authService as any, 'issueTokenPair')
      .mockReturnValue(fakeTokens);

    await authService.refreshAccessToken('fake_refresh_token');

    expect(issueSpy).toHaveBeenCalledWith(
      fakeUser._id.toString(),
      fakeUser.role,
      fakeUser.subscription,
    );
  });

  it('should return userId as string — not ObjectId', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyRefreshToken')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(authService as any, 'issueTokenPair')
      .mockReturnValue(fakeTokens);

    const result = await authService.refreshAccessToken('fake_refresh_token');

    expect(typeof result.userId).toBe('string');
    expect(result.userId).toBe(fakeUser._id.toString());
  });
});

describe('AuthService : logInUser', () => {
  const logInDTO = {
    email: 'test@mail.com',
    password: 'plain_password',
  };

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return LoginSession when credentials are valid', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    jest.spyOn(authService as any, 'issueTokenPair').mockReturnValue({
      accessToken: 'fake_access_token',
      refreshToken: 'fake_refresh_token',
    });
    jest
      .spyOn(AuthMapper, 'toUserCredientialsResponse')
      .mockReturnValue(fakeLoginResponse);

    const result = await authService.logInUser(logInDTO);

    expect(result).toEqual({
      tokens: {
        accessToken: 'fake_access_token',
        refreshToken: 'fake_refresh_token',
      },
      userDetails: fakeLoginResponse,
    });
  });

  it('should throw NotFoundError when user not found', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);

    await expect(authService.logInUser(logInDTO)).rejects.toThrow(
      'Invalid email or password',
    );
  });

  it('should throw UnauthorizedError when user is not verified', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue({
      ...fakeUser,
      isVerified: false,
    });

    await expect(authService.logInUser(logInDTO)).rejects.toThrow(
      'Email not verified',
    );
  });

  it('should throw UnauthorizedError when user is banned', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue({
      ...fakeUser,
      ban: true,
      banReason: 'Violation of terms',
    });

    await expect(authService.logInUser(logInDTO)).rejects.toThrow(
      'Violation of terms',
    );
  });

  it('should throw NotFoundError when password does not match', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(authService.logInUser(logInDTO)).rejects.toThrow(
      'Invalid email or password',
    );
  });

  it('should call issueTokenPair with correct user fields', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    const issueSpy = jest
      .spyOn(authService as any, 'issueTokenPair')
      .mockReturnValue({
        accessToken: 'fake_access_token',
        refreshToken: 'fake_refresh_token',
      });
    jest
      .spyOn(AuthMapper, 'toUserCredientialsResponse')
      .mockReturnValue(fakeLoginResponse);

    await authService.logInUser(logInDTO);

    expect(issueSpy).toHaveBeenCalledWith(
      fakeUser._id.toString(),
      fakeUser.role,
      fakeUser.subscription,
    );
  });

  it('should call AuthMapper with correct user', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    jest.spyOn(authService as any, 'issueTokenPair').mockReturnValue({
      accessToken: 'fake_access_token',
      refreshToken: 'fake_refresh_token',
    });
    const mapperSpy = jest
      .spyOn(AuthMapper, 'toUserCredientialsResponse')
      .mockReturnValue(fakeLoginResponse);

    await authService.logInUser(logInDTO);

    expect(mapperSpy).toHaveBeenCalledWith(fakeUser);
  });

  it('should compare correct plain password against stored hash', async () => {
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    const compareSpy = jest
      .spyOn(bcrypt, 'compare')
      .mockResolvedValue(true as never);
    jest.spyOn(authService as any, 'issueTokenPair').mockReturnValue({
      accessToken: 'fake_access_token',
      refreshToken: 'fake_refresh_token',
    });
    jest
      .spyOn(AuthMapper, 'toUserCredientialsResponse')
      .mockReturnValue(fakeLoginResponse);

    await authService.logInUser(logInDTO);

    expect(compareSpy).toHaveBeenCalledWith(
      logInDTO.password,
      fakeUser.password,
    );
  });
});

describe('AuthService : verifyEmail', () => {
  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return true when email is verified successfully', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue({
      ...fakeUser,
      isVerified: false,
    });
    (AuthRepository.prototype.verifyEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );

    const result = await authService.verifyEmail('fake_token');

    expect(result).toBe(true);
  });

  it('should return true early when user is already verified', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue({
      ...fakeUser,
      isVerified: true,
    });

    const result = await authService.verifyEmail('fake_token');

    expect(result).toBe(true);
    expect(AuthRepository.prototype.verifyEmail).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedError when user not found', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue(null);

    await expect(authService.verifyEmail('fake_token')).rejects.toThrow(
      'Invalid or expired token',
    );
  });

  it('should throw UnauthorizedError when token is invalid', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockImplementation(() => {
        throw new Error('invalid token');
      });

    await expect(authService.verifyEmail('fake_token')).rejects.toThrow(
      'Invalid or expired token',
    );
  });

  it('should call verifyEmail repository with correct id', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyJWTForEmails')
      .mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
    (AuthRepository.prototype.findById as jest.Mock).mockResolvedValue({
      ...fakeUser,
      isVerified: false,
    });
    (AuthRepository.prototype.verifyEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );

    await authService.verifyEmail('fake_token');

    expect(AuthRepository.prototype.verifyEmail).toHaveBeenCalledWith(
      fakeUser._id.toString(),
    );
  });
});

describe('AuthService : issueTokenPair', () => {
  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return correct AuthTokens shape', () => {
    jest
      .spyOn(JWTService.prototype, 'createJWT')
      .mockReturnValue('fake_access_token');
    jest
      .spyOn(JWTService.prototype, 'createRefreshToken')
      .mockReturnValue('fake_refresh_token');

    const result = authService.issueTokenPair(
      '507f1f77bcf86cd799439011',
      'Listener',
      fakeUser.subscription,
    );

    expect(result).toEqual({
      accessToken: 'fake_access_token',
      refreshToken: 'fake_refresh_token',
    });
  });

  it('should call createJWT with correct arguments', () => {
    const jwtSpy = jest
      .spyOn(JWTService.prototype, 'createJWT')
      .mockReturnValue('fake_access_token');
    jest
      .spyOn(JWTService.prototype, 'createRefreshToken')
      .mockReturnValue('fake_refresh_token');

    authService.issueTokenPair(
      '507f1f77bcf86cd799439011',
      'Listener',
      fakeUser.subscription,
    );

    expect(jwtSpy).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'Listener',
      fakeUser.subscription,
    );
  });

  it('should call createRefreshToken with correct userId', () => {
    jest
      .spyOn(JWTService.prototype, 'createJWT')
      .mockReturnValue('fake_access_token');
    const refreshSpy = jest
      .spyOn(JWTService.prototype, 'createRefreshToken')
      .mockReturnValue('fake_refresh_token');

    authService.issueTokenPair(
      '507f1f77bcf86cd799439011',
      'Listener',
      fakeUser.subscription,
    );

    expect(refreshSpy).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('should return accessToken from createJWT', () => {
    jest
      .spyOn(JWTService.prototype, 'createJWT')
      .mockReturnValue('fake_access_token');
    jest
      .spyOn(JWTService.prototype, 'createRefreshToken')
      .mockReturnValue('fake_refresh_token');

    const result = authService.issueTokenPair(
      '507f1f77bcf86cd799439011',
      'Listener',
      fakeUser.subscription,
    );

    expect(result.accessToken).toBe('fake_access_token');
  });

  it('should return refreshToken from createRefreshToken', () => {
    jest
      .spyOn(JWTService.prototype, 'createJWT')
      .mockReturnValue('fake_access_token');
    jest
      .spyOn(JWTService.prototype, 'createRefreshToken')
      .mockReturnValue('fake_refresh_token');

    const result = authService.issueTokenPair(
      '507f1f77bcf86cd799439011',
      'Listener',
      fakeUser.subscription,
    );

    expect(result.refreshToken).toBe('fake_refresh_token');
  });
});

describe('AuthService : issueIncompleteToken', () => {
  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return token string', () => {
    jest
      .spyOn(JWTService.prototype, 'signIncomplete')
      .mockReturnValue('fake_incomplete_token');

    const result = authService.issueIncompleteToken({
      googleId: 'google_123456',
      email: 'test@mail.com',
      displayName: 'John Doe',
    });

    expect(result).toBe('fake_incomplete_token');
  });

  it('should call signIncomplete with correct payload', () => {
    const signSpy = jest
      .spyOn(JWTService.prototype, 'signIncomplete')
      .mockReturnValue('fake_incomplete_token');

    authService.issueIncompleteToken({
      googleId: 'google_123456',
      email: 'test@mail.com',
      displayName: 'John Doe',
    });

    expect(signSpy).toHaveBeenCalledWith({
      googleId: 'google_123456',
      email: 'test@mail.com',
      displayName: 'John Doe',
    });
  });
});

describe('AuthService : completeGoogleSignUp', () => {
  const googleCompleteBody = {
    incompleteToken: 'fake_incomplete_token',
    dateOfBirth: new Date('1995-01-01'),
    gender: 'Male' as 'Male' | 'Female',
  };

  const fakePayload = {
    googleId: 'google_123456',
    email: 'test@mail.com',
    displayName: 'John Doe',
  };

  const fakeTokens = {
    accessToken: 'fake_access_token',
    refreshToken: 'fake_refresh_token',
  };

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return tokens and userDetails on success', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyIncomplete')
      .mockReturnValue(fakePayload);
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);
    (AuthRepository.prototype.createWithGoogle as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(authService as any, 'issueTokenPair')
      .mockReturnValue(fakeTokens);

    const result = await authService.completeGoogleSignUp(googleCompleteBody);

    expect(result).toEqual({
      accessToken: fakeTokens.accessToken,
      refreshToken: fakeTokens.refreshToken,
    });
  });

  it('should throw ResourceAlreadyExists when user already exists', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyIncomplete')
      .mockReturnValue(fakePayload);
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(
      fakeUser,
    );

    await expect(
      authService.completeGoogleSignUp(googleCompleteBody),
    ).rejects.toThrow('This user is logged in normally');
  });

  it('should call verifyIncomplete with correct token', async () => {
    const jwtSpy = jest
      .spyOn(JWTService.prototype, 'verifyIncomplete')
      .mockReturnValue(fakePayload);
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);
    (AuthRepository.prototype.createWithGoogle as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(authService as any, 'issueTokenPair')
      .mockReturnValue(fakeTokens);
    jest
      .spyOn(AuthMapper, 'toUserCredientialsResponse')
      .mockReturnValue(fakeLoginResponse);

    await authService.completeGoogleSignUp(googleCompleteBody);

    expect(jwtSpy).toHaveBeenCalledWith('fake_incomplete_token');
  });

  it('should call findByEmail with email from payload', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyIncomplete')
      .mockReturnValue(fakePayload);
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);
    (AuthRepository.prototype.createWithGoogle as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(authService as any, 'issueTokenPair')
      .mockReturnValue(fakeTokens);
    jest
      .spyOn(AuthMapper, 'toUserCredientialsResponse')
      .mockReturnValue(fakeLoginResponse);

    await authService.completeGoogleSignUp(googleCompleteBody);

    expect(AuthRepository.prototype.findByEmail).toHaveBeenCalledWith(
      'test@mail.com',
    );
  });

  it('should call createWithGoogle with correct args', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyIncomplete')
      .mockReturnValue(fakePayload);
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);
    (AuthRepository.prototype.createWithGoogle as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    jest
      .spyOn(authService as any, 'issueTokenPair')
      .mockReturnValue(fakeTokens);

    await authService.completeGoogleSignUp(googleCompleteBody);

    expect(AuthRepository.prototype.createWithGoogle).toHaveBeenCalledWith({
      googleId: 'google_123456',
      email: 'test@mail.com',
      displayName: 'John Doe',
      dateOfBirth: new Date('1995-01-01'),
      gender: 'Male',
    });
  });

  it('should call issueTokenPair with correct user fields', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyIncomplete')
      .mockReturnValue(fakePayload);
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);
    (AuthRepository.prototype.createWithGoogle as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    const issueSpy = jest
      .spyOn(authService as any, 'issueTokenPair')
      .mockReturnValue(fakeTokens);
    jest
      .spyOn(AuthMapper, 'toUserCredientialsResponse')
      .mockReturnValue(fakeLoginResponse);

    await authService.completeGoogleSignUp(googleCompleteBody);

    expect(issueSpy).toHaveBeenCalledWith(
      fakeUser._id.toString(),
      fakeUser.role,
      fakeUser.subscription,
    );
  });

  it('should throw when verifyIncomplete throws', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyIncomplete')
      .mockImplementation(() => {
        throw new Error('invalid token');
      });

    await expect(
      authService.completeGoogleSignUp(googleCompleteBody),
    ).rejects.toThrow('invalid token');
  });

  it('should throw when createWithGoogle throws', async () => {
    jest
      .spyOn(JWTService.prototype, 'verifyIncomplete')
      .mockReturnValue(fakePayload);
    (AuthRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);
    (AuthRepository.prototype.createWithGoogle as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      authService.completeGoogleSignUp(googleCompleteBody),
    ).rejects.toThrow('DB is down');
  });
});
