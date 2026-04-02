import { describe, it, expect } from '@jest/globals';
import User, { IUser } from '../../../src/shared/models/models.user';
import { AuthRepository } from '../../../src/modules/auth/auth.repository';
import { Types } from 'mongoose';

jest.mock('../../../src/shared/models/models.user');

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
  isPrivate: false,
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

let authRepository: AuthRepository;

describe('AuthRepo : Find By Email', () => {
  beforeEach(() => {
    authRepository = new AuthRepository();
    jest.clearAllMocks();
  });

  it('should return user when found', async () => {
    const fakeUser = {
      email: 'test@mail.com',
      password: 'hashed',
    };

    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUser),
    });

    const result = await authRepository.findByEmail('test@mail.com');

    expect(result).toEqual(fakeUser);
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@mail.com' });
  });

  it('should return null when user is not found', async () => {
    const fakeUser = null;

    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUser),
    });

    const result = await authRepository.findByEmail('test@unknown.com');

    expect(result).toEqual(fakeUser);
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@unknown.com' });
  });

  it('should select password field', async () => {
    const selectMock: jest.Mock = jest
      .fn()
      .mockResolvedValue({ email: 'test@mail.com' });
    (User.findOne as jest.Mock).mockReturnValue({
      select: selectMock,
    });

    await authRepository.findByEmail('test@mail.com');
    expect(selectMock).toHaveBeenCalledWith('+password');
  });

  it('should raise error when DB is down', async () => {
    const selectMock: jest.Mock = jest
      .fn()
      .mockRejectedValue(new Error('DB is Down'));
    (User.findOne as jest.Mock).mockReturnValue({
      select: selectMock,
    });

    await expect(authRepository.findByEmail('test@mail.com')).rejects.toThrow(
      'DB is Down',
    );
  });
});

describe('AuthRepo : create', () => {
  beforeEach(() => {
    authRepository = new AuthRepository();
    jest.clearAllMocks();
  });

  it('should return IUser', async () => {
    (User.create as jest.Mock).mockResolvedValue(fakeUser);
    const result = await authRepository.create(
      'test@mail.com',
      'hashed_password',
      'John Doe',
      new Date('1995-01-01'),
      'Male',
    );

    expect(result).toEqual(fakeUser);
    expect(result.email).toEqual('test@mail.com');
    expect(result.password).toEqual('hashed_password');
    expect(result.displayName).toEqual('John Doe');
    expect(result.dateOfBirth).toEqual(new Date('1995-01-01'));
    expect(result.gender).toEqual('Male');
  });

  it('should call User.create with correct fields', async () => {
    (User.create as jest.Mock).mockResolvedValue(fakeUser);

    await authRepository.create(
      'test@mail.com',
      'hashed_password',
      'John Doe',
      new Date('1995-01-01'),
      'Male',
    );

    expect(User.create).toHaveBeenCalledWith({
      email: 'test@mail.com',
      password: 'hashed_password',
      displayName: 'John Doe',
      dateOfBirth: new Date('1995-01-01'),
      gender: 'Male',
      role: 'Listener',
      profileLink: expect.stringMatching(/^john-doe-\d+$/),
    });
  });

  it('should call role with Listener always', async () => {
    (User.create as jest.Mock).mockResolvedValue(fakeUser);
    await authRepository.create(
      'test@mail.com',
      'hashed_password',
      'John Doe',
      new Date('1995-01-01'),
      'Male',
    );
    expect(fakeUser.role).toEqual('Listener');
  });

  it('should generate profileLink from displayName and timestamp', async () => {
    (User.create as jest.Mock).mockResolvedValue(fakeUser);

    const before = Date.now();
    await authRepository.create(
      'test@mail.com',
      'hashed_password',
      'John Doe',
      new Date('1995-01-01'),
      'Male',
    );
    const after = Date.now();

    // what went into User.create
    const calledWith = (User.create as jest.Mock).mock.calls[0][0];

    expect(calledWith.profileLink).toMatch(/^john-doe-\d+$/);

    // check timestamp
    const timestamp = parseInt(calledWith.profileLink.split('-').pop());
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('should handle displayName with multiple spaces', async () => {
    (User.create as jest.Mock).mockResolvedValue(fakeUser);

    await authRepository.create(
      'test@mail.com',
      'hashed_password',
      'John      Doe',
      new Date('1995-01-01'),
      'Male',
    );

    const calledWith = (User.create as jest.Mock).mock.calls[0][0];

    expect(calledWith.profileLink).toMatch(/^john-doe-\d+$/);
  });

  it('should raise error when DB is down', async () => {
    const selectMock: jest.Mock = jest
      .fn()
      .mockRejectedValue(new Error('DB is Down'));
    (User.create as jest.Mock).mockReturnValue({
      select: selectMock,
    });

    await expect(authRepository.findByEmail('test@mail.com')).rejects.toThrow(
      'DB is Down',
    );
  });
});

describe('AuthRepo : verifyEmail', () => {
  beforeEach(() => {
    authRepository = new AuthRepository();
    jest.clearAllMocks();
  });

  it('should return updated user when found', async () => {
    const updatedUser = { ...fakeUser, isVerified: true };

    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedUser);

    const result = await authRepository.verifyEmail('507f1f77bcf86cd799439011');

    expect(result).toEqual(updatedUser);
    expect(result?.isVerified).toBe(true);
  });

  it('should call findByIdAndUpdate with correct arguments', async () => {
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(fakeUser);

    await authRepository.verifyEmail('507f1f77bcf86cd799439011');

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011', // correct id
      { isVerified: true }, // correct update
      { new: true }, // returns updated doc
    );
  });

  it('should return null when user not found', async () => {
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

    const result = await authRepository.verifyEmail('nonexistent_id');

    expect(result).toBeNull();
  });

  it('should raise error when DB is down', async () => {
    (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      authRepository.verifyEmail('507f1f77bcf86cd799439011'),
    ).rejects.toThrow('DB is down');
  });
});

describe('AuthRepo : changePassword', () => {
  beforeEach(() => {
    authRepository = new AuthRepository();
    jest.clearAllMocks();
  });

  it('should return updated user with new password', async () => {
    const updatedUser = { ...fakeUser, password: 'new_hashed_password' };
    const selectMock: jest.Mock = jest.fn().mockResolvedValue(updatedUser);

    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: selectMock,
    });

    const result = await authRepository.changePassword(
      '507f1f77bcf86cd799439011',
      'new_hashed_password',
    );

    expect(result).toEqual(updatedUser);
  });

  it('should call findByIdAndUpdate with correct arguments', async () => {
    const selectMock: jest.Mock = jest.fn().mockResolvedValue(fakeUser);

    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: selectMock,
    });

    await authRepository.changePassword(
      '507f1f77bcf86cd799439011',
      'new_hashed_password',
    );

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { password: 'new_hashed_password' },
      { new: true },
    );
  });

  it('should select +password field', async () => {
    const selectMock: jest.Mock = jest.fn().mockResolvedValue(fakeUser);

    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: selectMock,
    });

    await authRepository.changePassword(
      '507f1f77bcf86cd799439011',
      'new_hashed_password',
    );

    expect(selectMock).toHaveBeenCalledWith('+password');
  });

  it('should return null when user not found', async () => {
    const selectMock: jest.Mock = jest.fn().mockResolvedValue(null);

    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: selectMock,
    });

    const result = await authRepository.changePassword(
      'nonexistent_id',
      'new_hashed_password',
    );

    expect(result).toBeNull();
  });

  it('should raise error when DB is down', async () => {
    const selectMock: jest.Mock = jest
      .fn()
      .mockRejectedValue(new Error('DB is down'));

    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: selectMock,
    });

    await expect(
      authRepository.changePassword(
        '507f1f77bcf86cd799439011',
        'new_hashed_password',
      ),
    ).rejects.toThrow('DB is down');
  });
});

describe('AuthRepo : linkGoogleId', () => {
  beforeEach(() => {
    authRepository = new AuthRepository();
    jest.clearAllMocks();
  });

  it('should call findByIdAndUpdate with correct arguments', async () => {
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

    await authRepository.linkGoogleId(
      '507f1f77bcf86cd799439011',
      'google_123456',
    );

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { googleId: 'google_123456' },
    );
  });

  it('should throw when DB is down', async () => {
    (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      authRepository.linkGoogleId('507f1f77bcf86cd799439011', 'google_123456'),
    ).rejects.toThrow('DB is down');
  });
});

describe('AuthRepo : createWithGoogle', () => {
  const googleData = {
    googleId: 'google_123456',
    email: 'test@mail.com',
    displayName: 'John Doe',
    dateOfBirth: new Date('1995-01-01'),
    gender: 'Male' as 'Male' | 'Female',
  };

  beforeEach(() => {
    authRepository = new AuthRepository();
    jest.clearAllMocks();
  });

  it('should return created user', async () => {
    (User.create as jest.Mock).mockResolvedValue(fakeUser);

    const result = await authRepository.createWithGoogle(googleData);

    expect(result).toEqual(fakeUser);
  });

  it('should call User.create with correct fields', async () => {
    (User.create as jest.Mock).mockResolvedValue(fakeUser);

    await authRepository.createWithGoogle(googleData);

    expect(User.create).toHaveBeenCalledWith({
      googleId: 'google_123456',
      email: 'test@mail.com',
      displayName: 'John Doe',
      dateOfBirth: new Date('1995-01-01'),
      gender: 'Male',
      role: 'Listener',
      isVerified: true,
      profileLink: expect.stringMatching(/^john-doe-\d+$/),
    });
  });

  it('should always set isVerified to true', async () => {
    (User.create as jest.Mock).mockResolvedValue(fakeUser);

    await authRepository.createWithGoogle(googleData);

    const calledWith = (User.create as jest.Mock).mock.calls[0][0];
    expect(calledWith.isVerified).toBe(true);
  });

  it('should always set role to Listener', async () => {
    (User.create as jest.Mock).mockResolvedValue(fakeUser);

    await authRepository.createWithGoogle(googleData);

    const calledWith = (User.create as jest.Mock).mock.calls[0][0];
    expect(calledWith.role).toBe('Listener');
  });

  it('should generate profileLink from displayName and timestamp', async () => {
    (User.create as jest.Mock).mockResolvedValue(fakeUser);

    const before = Date.now();
    await authRepository.createWithGoogle(googleData);
    const after = Date.now();

    const calledWith = (User.create as jest.Mock).mock.calls[0][0];

    expect(calledWith.profileLink).toMatch(/^john-doe-\d+$/);
    const timestamp = parseInt(calledWith.profileLink.split('-').pop());
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('should raise error when DB is down', async () => {
    (User.create as jest.Mock).mockRejectedValue(new Error('DB is down'));

    await expect(authRepository.createWithGoogle(googleData)).rejects.toThrow(
      'DB is down',
    );
  });
});

describe('AuthRepo : createWithCredentials', () => {
  const credentialsData = {
    email: 'test@mail.com',
    password: 'hashed_password',
    displayName: 'John Doe',
    dateOfBirth: new Date('1995-01-01'),
    gender: 'Male' as 'Male' | 'Female',
  };

  beforeEach(() => {
    authRepository = new AuthRepository();
    jest.clearAllMocks();
  });

  it('should return created user', async () => {
    (User.create as jest.Mock).mockResolvedValue(fakeUser);

    const result = await authRepository.createWithCredentials(credentialsData);

    expect(result).toEqual(fakeUser);
  });

  it('should call User.create with exact data — no transformation', async () => {
    (User.create as jest.Mock).mockResolvedValue(fakeUser);

    await authRepository.createWithCredentials(credentialsData);

    expect(User.create).toHaveBeenCalledWith(credentialsData);
  });

  it('should throw when DB is down', async () => {
    (User.create as jest.Mock).mockRejectedValue(new Error('DB is down'));

    await expect(
      authRepository.createWithCredentials(credentialsData),
    ).rejects.toThrow('DB is down');
  });
});
