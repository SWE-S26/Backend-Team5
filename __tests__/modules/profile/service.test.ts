import { ProfileService } from '../../../src/modules/profile/profile.service';
import { ProfileRepository } from '../../../src/modules/profile/profile.repository';

import { CloudinaryService } from '../../../src/shared/abstractions/cloudinary.service';
import {
  ResourceAlreadyExists,
  NotFoundError,
} from '../../../src/shared/errors/responseErrors';

// ✅ FIXED mock path (must match actual import inside service)
jest.mock('../../../src/shared/abstractions/cloudinary.service', () => ({
  CloudinaryService: {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  },
  ImageFolder: {
    PROFILE: 'PROFILE',
  },
}));

describe('ProfileService - FULL TEST', () => {
  let service: ProfileService;
  let repo: jest.Mocked<ProfileRepository>;

  beforeEach(() => {
    repo = {
      getProfileById: jest.fn(),
      getUserStats: jest.fn(),
      isFollowed: jest.fn(),
      isBlocked: jest.fn(),
      updateProfile: jest.fn(),
      updateProfileImages: jest.fn(),
      getPrivacySettings: jest.fn(),
      updatePrivacySettings: jest.fn(),
      getNotificationsSettings: jest.fn(),
      updateNotificationsSettings: jest.fn(),
      getAccountSettings: jest.fn(),
      updateAccountSettings: jest.fn(),
      getContentSettings: jest.fn(),
      updateContentSettings: jest.fn(),
      getProfileByProfileLink: jest.fn(),
      isProfileLinkTaken: jest.fn(),
    } as any;

    service = new ProfileService(repo);
    jest.clearAllMocks();
  });

  // =========================
  // getProfileById
  // =========================
  it('getProfileById - success with relationships', async () => {
    repo.getProfileById.mockResolvedValue({ _id: 'u1' } as any);

    repo.getUserStats.mockResolvedValue({
      trackCount: 1,
      followersCount: 2,
      followedCount: 3,
    });

    repo.isFollowed.mockResolvedValue(true);
    repo.isBlocked.mockResolvedValue(false);

    const result = await service.getProfileById('u1', 'u2');

    expect(repo.getProfileById).toHaveBeenCalledWith('u1');
    expect(repo.getUserStats).toHaveBeenCalledWith('u1');
    expect(result).toBeDefined();
  });

  it('getProfileById - throws if not found', async () => {
    repo.getProfileById.mockResolvedValue(null);

    await expect(service.getProfileById('u1', null)).rejects.toThrow(
      'User not found',
    );
  });

  it('getProfileById - skips relations when same user', async () => {
    repo.getProfileById.mockResolvedValue({ _id: 'u1' } as any);

    repo.getUserStats.mockResolvedValue({
      trackCount: 0,
      followersCount: 0,
      followedCount: 0,
    });

    const result = await service.getProfileById('u1', 'u1');

    expect(repo.isFollowed).not.toHaveBeenCalled();
    expect(repo.isBlocked).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  // =========================
  // updateProfile
  // =========================
  it('updateProfile - success', async () => {
    repo.updateProfile.mockResolvedValue({
      _id: 'u1',
      profileLink: 'ahmed123',
    } as any);

    repo.getUserStats.mockResolvedValue({
      trackCount: 1,
      followersCount: 1,
      followedCount: 1,
    });

    const result = await service.updateProfile('u1', {
      profileLink: 'ahmed123',
    });

    expect(repo.updateProfile).toHaveBeenCalledWith('u1', {
      profileLink: 'ahmed123',
    });

    expect(result).toBeDefined();
  });

  it('updateProfile - duplicate profileLink error', async () => {
    repo.updateProfile.mockRejectedValue({
      code: 11000,
      keyPattern: { profileLink: 1 },
    });

    await expect(
      service.updateProfile('u1', { profileLink: 'taken' }),
    ).rejects.toThrow('Profile link already taken');
  });

  it('updateProfile - user not found', async () => {
    repo.updateProfile.mockResolvedValue(null);

    await expect(service.updateProfile('u1', {})).rejects.toThrow(
      'User not found',
    );
  });

  // =========================
  // updateProfileImages
  // =========================
  it('updateProfileImages - remove profile image', async () => {
    repo.getProfileById.mockResolvedValue({
      _id: 'u1',
      profileImg: { publicId: 'img1' },
    } as any);

    repo.updateProfileImages.mockResolvedValue({ _id: 'u1' } as any);

    const result = await service.updateProfileImages(
      'u1',
      { removeProfileImg: true },
      {},
    );

    expect(CloudinaryService.deleteImage).toHaveBeenCalledWith('img1');
    expect(result).toBeDefined();
  });

  it('updateProfileImages - upload profile image', async () => {
    repo.getProfileById.mockResolvedValue({
      _id: 'u1',
      profileImg: { publicId: 'img1' },
    } as any);

    (CloudinaryService.uploadImage as jest.Mock).mockResolvedValue({
      url: 'url',
      publicId: 'newId',
    });

    repo.updateProfileImages.mockResolvedValue({ _id: 'u1' } as any);

    const result = await service.updateProfileImages(
      'u1',
      {},
      {
        profileImg: [{ buffer: Buffer.from('x') }] as any,
      },
    );

    expect(CloudinaryService.uploadImage).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('updateProfileImages - user not found', async () => {
    repo.getProfileById.mockResolvedValue(null);

    await expect(service.updateProfileImages('u1', {}, {})).rejects.toThrow(
      'User not found',
    );
  });

  it('updateProfileImages - final update missing user', async () => {
    repo.getProfileById.mockResolvedValue({ _id: 'u1' } as any);
    repo.updateProfileImages.mockResolvedValue(null);

    await expect(service.updateProfileImages('u1', {}, {})).rejects.toThrow(
      'User not found',
    );
  });

  // =========================
  // Privacy settings
  // =========================
  it('getPrivacySettings - success', async () => {
    repo.getPrivacySettings.mockResolvedValue({
      allowMessagesAnyone: true,
    } as any);

    const result = await service.getPrivacySettings('u1');

    expect(result).toEqual({ allowMessagesAnyone: true });
  });

  it('getPrivacySettings - not found', async () => {
    repo.getPrivacySettings.mockResolvedValue(null);

    await expect(service.getPrivacySettings('u1')).rejects.toThrow(
      'User settings not found',
    );
  });

  it('updatePrivacySettings - success', async () => {
    repo.updatePrivacySettings.mockResolvedValue({
      allowMessagesAnyone: false,
    } as any);

    const result = await service.updatePrivacySettings('u1', {
      allowMessagesAnyone: false,
    });

    expect(result).toEqual({ allowMessagesAnyone: false });
  });

  it('updatePrivacySettings - not found', async () => {
    repo.updatePrivacySettings.mockResolvedValue(null);

    await expect(service.updatePrivacySettings('u1', {})).rejects.toThrow(
      'User settings not found',
    );
  });

  // =========================
  // Profile by link
  // =========================
  it('getProfileByProfileLink - success', async () => {
    repo.getProfileByProfileLink.mockResolvedValue({
      _id: { toString: () => 'u2' },
    } as any);

    repo.getUserStats.mockResolvedValue({
      trackCount: 1,
      followersCount: 1,
      followedCount: 1,
    });

    const result = await service.getProfileByProfileLink('ahmed', 'u1');

    expect(result).toBeDefined();
  });

  it('getProfileByProfileLink - not found', async () => {
    repo.getProfileByProfileLink.mockResolvedValue(null);

    await expect(
      service.getProfileByProfileLink('ahmed', null),
    ).rejects.toThrow('User not found');
  });

  // =========================
  // isProfileLinkTaken
  // =========================
  it('isProfileLinkTaken', async () => {
    repo.isProfileLinkTaken.mockResolvedValue(true);

    const result = await service.isProfileLinkTaken('ahmed');

    expect(result).toEqual({ taken: true });
  });
});
