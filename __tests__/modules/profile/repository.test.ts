import { ProfileRepository } from '../../../src/modules/profile/profile.repository';

import User from '../../../src/shared/models/models.user';
import Settings from '../../../src/shared/models/models.settings';
import Following from '../../../src/shared/models/models.following';
import Track from '../../../src/shared/models/models.track';
import blockedListSchema from '../../../src/shared/models/models.blocked-list';

jest.mock('../../../src/shared/models/models.user');
jest.mock('../../../src/shared/models/models.settings');
jest.mock('../../../src/shared/models/models.following');
jest.mock('../../../src/shared/models/models.track');
jest.mock('../../../src/shared/models/models.blocked-list');

describe('ProfileRepository - FULL TEST', () => {
  let repo: ProfileRepository;

  beforeEach(() => {
    repo = new ProfileRepository();
    jest.clearAllMocks();
  });

  // =========================
  // getProfileById
  // =========================
  it('getProfileById - success', async () => {
    (User.findById as any).mockReturnValue({
      lean: () => ({ _id: 'u1' }),
    });

    const result = await repo.getProfileById('u1');

    expect(User.findById).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ _id: 'u1' });
  });

  // =========================
  // updateProfile
  // =========================
  it('updateProfile - merges fields correctly', async () => {
    (User.findByIdAndUpdate as any).mockReturnValue({
      lean: () => ({ _id: 'u1', profileLink: 'ahmed' }),
    });

    const result = await repo.updateProfile('u1', {
      profileLink: 'ahmed',
      links: ['a'],
      bannerLinks: ['b'],
    } as any);

    expect(User.findByIdAndUpdate).toHaveBeenCalled();
    expect(result?.profileLink).toBe('ahmed');
  });

  // =========================
  // updateProfileImages
  // =========================
  it('updateProfileImages - updates both images', async () => {
    (User.findByIdAndUpdate as any).mockReturnValue({
      lean: () => ({ _id: 'u1' }),
    });

    const result = await repo.updateProfileImages('u1', {
      profileImg: { imgLink: 'a', publicId: 'p1' },
      bannerImg: { imgLink: 'b', publicId: 'b1' },
    });

    expect(result).toEqual({ _id: 'u1' });
  });

  // =========================
  // getPrivacySettings
  // =========================
  it('getPrivacySettings - returns settings', async () => {
    (Settings.findOne as any).mockReturnValue({
      lean: () => ({ privacy: { allowMessagesAnyone: true } }),
    });

    const result = await repo.getPrivacySettings('u1');

    expect(result).toEqual({ allowMessagesAnyone: true });
  });

  it('getPrivacySettings - returns null when missing', async () => {
    (Settings.findOne as any).mockReturnValue({
      lean: () => null,
    });

    const result = await repo.getPrivacySettings('u1');

    expect(result).toBeNull();
  });

  // =========================
  // updatePrivacySettings
  // =========================
  it('updatePrivacySettings - merges correctly', async () => {
    (Settings.findOne as any)
      .mockReturnValueOnce({
        lean: () => ({
          privacy: { allowMessagesAnyone: true },
        }),
      })
      .mockReturnValueOnce({
        lean: () => ({
          privacy: { allowMessagesAnyone: false },
        }),
      });

    (Settings.findOneAndUpdate as any).mockReturnValue({
      lean: () => ({
        privacy: { allowMessagesAnyone: false },
      }),
    });

    const result = await repo.updatePrivacySettings('u1', {
      allowMessagesAnyone: false,
    } as any);

    expect(result).toEqual({ allowMessagesAnyone: false });
  });

  it('updatePrivacySettings - returns null if no settings', async () => {
    const findOneMock = jest.fn().mockReturnValue({
      lean: () => null,
    });

    (Settings.findOne as any) = findOneMock;
    (Settings.findOneAndUpdate as any) = jest.fn();

    const result = await repo.updatePrivacySettings('u1', {} as any);

    expect(Settings.findOne).toHaveBeenCalled();
    expect(Settings.findOneAndUpdate).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  // =========================
  // Notifications settings
  // =========================
  it('getNotificationsSettings', async () => {
    (Settings.findOne as any).mockReturnValue({
      lean: () => ({ notifications: { email: true } }),
    });

    const result = await repo.getNotificationsSettings('u1');

    expect(result).toEqual({ email: true });
  });

  // =========================
  // Account settings
  // =========================
  it('getAccountSettings', async () => {
    (Settings.findOne as any).mockReturnValue({
      lean: () => ({ account: { theme: 'dark' } }),
    });

    const result = await repo.getAccountSettings('u1');

    expect(result).toEqual({ theme: 'dark' });
  });

  it('updateAccountSettings - updates user fields too', async () => {
    (Settings.findOne as any)
      .mockReturnValueOnce({
        lean: () => ({
          account: { theme: 'dark' },
        }),
      })
      .mockReturnValueOnce({
        lean: () => ({
          account: { theme: 'light' },
        }),
      });

    (Settings.findOneAndUpdate as any).mockReturnValue({
      lean: () => ({
        account: { theme: 'light' },
      }),
    });

    (User.findByIdAndUpdate as any).mockResolvedValue({});

    const result = await repo.updateAccountSettings('u1', {
      theme: 'light',
      gender: 'male',
    } as any);

    expect(User.findByIdAndUpdate).toHaveBeenCalled();
    expect(result).toEqual({ theme: 'light' });
  });

  // =========================
  // Content settings
  // =========================
  it('updateContentSettings', async () => {
    (Settings.findOne as any)
      .mockReturnValueOnce({
        lean: () => ({
          content: { ads: true },
        }),
      })
      .mockReturnValueOnce({
        lean: () => ({
          content: { ads: false },
        }),
      });

    (Settings.findOneAndUpdate as any).mockReturnValue({
      lean: () => ({
        content: { ads: false },
      }),
    });

    const result = await repo.updateContentSettings('u1', {
      ads: false,
    } as any);

    expect(result).toEqual({ ads: false });
  });

  // =========================
  // Profile link
  // =========================
  it('getProfileByProfileLink', async () => {
    (User.findOne as any).mockReturnValue({
      lean: () => ({ _id: 'u1' }),
    });

    const result = await repo.getProfileByProfileLink('ahmed');

    expect(result).toEqual({ _id: 'u1' });
  });

  it('isProfileLinkTaken', async () => {
    (User.findOne as any).mockReturnValue({
      lean: () => ({ _id: 'u1' }),
    });

    const result = await repo.isProfileLinkTaken('ahmed');

    expect(result).toBe(true);
  });

  // =========================
  // User stats
  // =========================
  it('getUserStats', async () => {
    (Following.findOne as any).mockReturnValue({
      lean: () => ({
        followers: ['a', 'b'],
        followed: ['c'],
      }),
    });

    (Track.countDocuments as any).mockResolvedValue(5);

    const result = await repo.getUserStats('u1');

    expect(result).toEqual({
      followersCount: 2,
      followedCount: 1,
      trackCount: 5,
    });
  });

  // =========================
  // Relationships
  // =========================
  it('isFollowed', async () => {
    (Following.findOne as any).mockReturnValue({
      lean: () => ({ _id: 'x' }),
    });

    const result = await repo.isFollowed('u1', 'u2');

    expect(result).toBe(true);
  });

  it('isBlocked', async () => {
    (blockedListSchema.findOne as any).mockReturnValue({
      lean: () => ({ _id: 'x' }),
    });

    const result = await repo.isBlocked('u1', 'u2');

    expect(result).toBe(true);
  });
});
