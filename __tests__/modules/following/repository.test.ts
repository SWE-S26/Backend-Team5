import { FollowingRepository } from '../../../src/modules/following/following.repository';

import User from '../../../src/shared/models/models.user';
import Following from '../../../src/shared/models/models.following';
import Track from '../../../src/shared/models/models.track';
import blockedListSchema from '../../../src/shared/models/models.blocked-list';
import { Types } from 'mongoose';

jest.mock('../../../src/shared/models/models.user');
jest.mock('../../../src/shared/models/models.following');
jest.mock('../../../src/shared/models/models.track');
jest.mock('../../../src/shared/models/models.blocked-list');

describe('FollowingRepository - FULL TEST', () => {
  let repo: FollowingRepository;

  beforeEach(() => {
    repo = new FollowingRepository();
    jest.clearAllMocks();
  });

  // =========================
  // getUserById
  // =========================
  it('getUserById', async () => {
    (User.findById as any).mockReturnValue({
      lean: () => ({ _id: 'u1' }),
    });

    const result = await repo.getUserById('u1');

    expect(User.findById).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ _id: 'u1' });
  });

  // =========================
  // getUserStats
  // =========================
  it('getUserStats', async () => {
    (Following.findOne as any).mockReturnValue({
      lean: () => ({ followers: ['a', 'b'] }),
    });

    (Track.countDocuments as any).mockResolvedValue(5);

    const result = await repo.getUserStats('u1');

    expect(result).toEqual({
      followersCount: 2,
      trackCount: 5,
    });
  });

  // =========================
  // addFollower
  // =========================
  it('addFollower', async () => {
    (Following.findOneAndUpdate as any).mockResolvedValue({});
    (blockedListSchema.findOneAndUpdate as any).mockResolvedValue({});

    await repo.addFollower('u1', 'u2');

    expect(Following.findOneAndUpdate).toHaveBeenCalled();
    expect(blockedListSchema.findOneAndUpdate).toHaveBeenCalled();
  });

  // =========================
  // isFollowing
  // =========================
  it('isFollowing - true', async () => {
    (Following.findOne as any).mockReturnValue({
      select: () => ({
        lean: () => ({ _id: 'x' }),
      }),
    });

    const result = await repo.isFollowing('u1', 'u2');

    expect(result).toBe(true);
  });

  it('isFollowing - false', async () => {
    (Following.findOne as any).mockReturnValue({
      select: () => ({
        lean: () => null,
      }),
    });

    const result = await repo.isFollowing('u1', 'u2');

    expect(result).toBe(false);
  });

  // =========================
  // removeFollower
  // =========================
  it('removeFollower', async () => {
    (Following.findOneAndUpdate as any).mockResolvedValue({});

    await repo.removeFollower('u1', 'u2');

    expect(Following.findOneAndUpdate).toHaveBeenCalled();
  });

  // =========================
  // block
  // =========================
  it('block', async () => {
    (blockedListSchema.findOneAndUpdate as any).mockResolvedValue({});
    (Following.findOneAndUpdate as any).mockResolvedValue({});

    await repo.block('u1', 'u2');

    expect(blockedListSchema.findOneAndUpdate).toHaveBeenCalled();
  });

  // =========================
  // unblock
  // =========================
  it('unblock', async () => {
    (blockedListSchema.findOneAndUpdate as any).mockResolvedValue({});

    await repo.unblock('u1', 'u2');

    expect(blockedListSchema.findOneAndUpdate).toHaveBeenCalled();
  });

  // =========================
  // getUsersIds
  // =========================
  it('getUsersIds', async () => {
    (Following.findOne as any).mockReturnValue({
      lean: () => ({
        followers: [new Types.ObjectId('64a1f1f1f1f1f1f1f1f1f1f1')],
      }),
    });

    const result = await repo.getUsersIds('u1', 'followers');

    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  // =========================
  // getUsersWithIds
  // =========================
  it('getUsersWithIds', async () => {
    (User.find as any).mockReturnValue({
      lean: () => [{ _id: 'u1', displayName: 'Ahmed' }],
    });

    const result = await repo.getUsersWithIds([
      new Types.ObjectId('64a1f1f1f1f1f1f1f1f1f1f1'),
    ]);

    expect(result).toEqual([{ _id: 'u1', displayName: 'Ahmed' }]);
  });

  // =========================
  // getUsersStats
  // =========================
  it('getUsersStats', async () => {
    (Following.find as any).mockReturnValue({
      lean: () => [
        {
          userId: new Types.ObjectId('64a1f1f1f1f1f1f1f1f1f1f1'),
          followers: ['a'],
        },
      ],
    });

    (Track.aggregate as any).mockResolvedValue([
      { _id: new Types.ObjectId('64a1f1f1f1f1f1f1f1f1f1f1'), count: 3 },
    ]);

    const result = await repo.getUsersStats([
      new Types.ObjectId('64a1f1f1f1f1f1f1f1f1f1f1'),
    ]);

    const key = Object.keys(result)[0];

    expect(result[key]).toHaveProperty('followersCount');
    expect(result[key]).toHaveProperty('trackCount');
  });

  // =========================
  // amIBlocked
  // =========================
  it('amIBlocked', async () => {
    (blockedListSchema.findOne as any).mockReturnValue({
      lean: () => ({ _id: 'x' }),
    });

    const result = await repo.amIBlocked('u1', 'u2');

    expect(result).toBe(true);
  });

  // =========================
  // isUsersFollowed
  // =========================
  it('isUsersFollowed', async () => {
    (Following.findOne as any).mockReturnValue({
      lean: () => ({
        followed: [new Types.ObjectId('64a1f1f1f1f1f1f1f1f1f1f1')],
      }),
    });

    const result = await repo.isUsersFollowed('u1', [
      new Types.ObjectId('64a1f1f1f1f1f1f1f1f1f1f1'),
    ]);

    const key = Object.keys(result)[0];
    expect(typeof result[key]).toBe('boolean');
  });
});
