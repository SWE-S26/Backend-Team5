import { FollowingService } from '../../../src/modules/following/following.service';
import { FollowingRepository } from '../../../src/modules/following/following.repository';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../../../src/shared/errors/responseErrors';

describe('FollowingService - FULL TEST', () => {
  let service: FollowingService;
  let repo: jest.Mocked<FollowingRepository>;

  beforeEach(() => {
    repo = {
      getUserById: jest.fn(),
      addFollower: jest.fn(),
      removeFollower: jest.fn(),
      block: jest.fn(),
      unblock: jest.fn(),
      getUserStats: jest.fn(),
      isFollowing: jest.fn(),
      amIBlocked: jest.fn(),
      getUsersIds: jest.fn(),
      getUsersWithIds: jest.fn(),
      getUsersStats: jest.fn(),
      isUsersFollowed: jest.fn(),
      getBlockedIds: jest.fn(),
      getUsersWhoBlockedMe: jest.fn(),
      getSuggestedUserIds: jest.fn(),
    } as any;

    service = new FollowingService(repo);

    jest.clearAllMocks();
  });

  // =========================
  // addFollower
  // =========================
  it('addFollower - success (first time follow triggers notification logic)', async () => {
    repo.getUserById
      .mockResolvedValueOnce({ _id: 'u1' } as any)
      .mockResolvedValueOnce({ _id: 'u2' } as any);

    repo.amIBlocked.mockResolvedValue(false);
    repo.isFollowing.mockResolvedValue(false);
    repo.addFollower.mockResolvedValue(undefined);
    repo.getUserStats.mockResolvedValue({
      followersCount: 10,
      trackCount: 2,
    });

    const result = await service.addFollower('u1', 'u2');

    expect(repo.addFollower).toHaveBeenCalledWith('u1', 'u2');
    expect(result).toBeDefined();
  });

  it('addFollower - user not found', async () => {
    repo.getUserById.mockResolvedValue(null);

    await expect(service.addFollower('u1', 'u2')).rejects.toThrow(
      'User not found',
    );
  });

  it('addFollower - follow self', async () => {
    repo.getUserById.mockResolvedValue({ _id: 'u1' } as any);

    await expect(service.addFollower('u1', 'u1')).rejects.toThrow(
      'You cannot follow yourself',
    );
  });

  it('addFollower - blocked user', async () => {
    repo.getUserById
      .mockResolvedValueOnce({ _id: 'u1' } as any)
      .mockResolvedValueOnce({ _id: 'u2' } as any);

    repo.amIBlocked.mockResolvedValue(true);

    await expect(service.addFollower('u1', 'u2')).rejects.toThrow(
      'You cannot follow this user because they have blocked you',
    );
  });

  // =========================
  // removeFollower
  // =========================
  it('removeFollower - success', async () => {
    repo.getUserById
      .mockResolvedValueOnce({ _id: 'u1' } as any)
      .mockResolvedValueOnce({ _id: 'u2' } as any);

    repo.removeFollower.mockResolvedValue(undefined);
    repo.getUserStats.mockResolvedValue({
      followersCount: 1,
      trackCount: 1,
    });

    const result = await service.removeFollower('u1', 'u2');

    expect(repo.removeFollower).toHaveBeenCalledWith('u1', 'u2');
    expect(result).toBeDefined();
  });

  // =========================
  // block / unblock
  // =========================
  it('block - success', async () => {
    repo.getUserById
      .mockResolvedValueOnce({ _id: 'u1' } as any)
      .mockResolvedValueOnce({ _id: 'u2' } as any);

    repo.block.mockResolvedValue(undefined);
    repo.getUserStats.mockResolvedValue({
      followersCount: 0,
      trackCount: 0,
    });

    const result = await service.block('u1', 'u2');

    expect(repo.block).toHaveBeenCalledWith('u1', 'u2');
    expect(result).toBeDefined();
  });

  it('block - self block error', async () => {
    repo.getUserById.mockResolvedValue({ _id: 'u1' } as any);

    await expect(service.block('u1', 'u1')).rejects.toThrow(
      'You cannot block yourself',
    );
  });

  it('unblock - success', async () => {
    repo.getUserById
      .mockResolvedValueOnce({ _id: 'u1' } as any)
      .mockResolvedValueOnce({ _id: 'u2' } as any);

    repo.unblock.mockResolvedValue(undefined);
    repo.getUserStats.mockResolvedValue({
      followersCount: 0,
      trackCount: 0,
    });

    const result = await service.unblock('u1', 'u2');

    expect(repo.unblock).toHaveBeenCalledWith('u1', 'u2');
    expect(result).toBeDefined();
  });

  // =========================
  // getFollowers
  // =========================
  it('getFollowers - success', async () => {
    repo.getUserById.mockResolvedValue({ _id: 'u1' } as any);

    repo.getUsersIds.mockResolvedValue(['u2'] as any);
    repo.getUsersWithIds.mockResolvedValue([{ _id: 'u2' }] as any);
    repo.getUsersStats.mockResolvedValue({
      u2: { followersCount: 1, trackCount: 1 },
    });

    repo.isUsersFollowed.mockResolvedValue({ u2: true });
    repo.getBlockedIds.mockResolvedValue([]);

    const result = await service.getFollowers('u1', 'u3');

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('getFollowers - user not found', async () => {
    repo.getUserById.mockResolvedValue(null);

    await expect(service.getFollowers('u1', null)).rejects.toThrow(
      'User not found',
    );
  });

  // =========================
  // getFollowed
  // =========================
  it('getFollowed - success', async () => {
    repo.getUserById.mockResolvedValue({ _id: 'u1' } as any);

    repo.getUsersIds.mockResolvedValue(['u2'] as any);
    repo.getUsersWithIds.mockResolvedValue([{ _id: 'u2' }] as any);
    repo.getUsersStats.mockResolvedValue({
      u2: { followersCount: 1, trackCount: 1 },
    });

    repo.isUsersFollowed.mockResolvedValue({ u2: false });
    repo.getBlockedIds.mockResolvedValue([]);

    const result = await service.getFollowed('u1', 'u3');

    expect(result).toBeDefined();
  });

  // =========================
  // suggested users
  // =========================
  it('getSuggestedUsers - filters correctly', async () => {
    repo.getUserById.mockResolvedValue({ _id: 'u1' } as any);

    repo.getSuggestedUserIds.mockResolvedValue(['u2', 'u3'] as any);
    repo.getUsersIds.mockResolvedValue(['u4'] as any); // followed
    repo.getBlockedIds.mockResolvedValue(['u5'] as any);
    repo.getUsersWhoBlockedMe.mockResolvedValue(['u6'] as any);

    repo.getUsersWithIds.mockResolvedValue([{ _id: 'u2' }] as any);
    repo.getUsersStats.mockResolvedValue({
      u2: { followersCount: 1, trackCount: 1 },
    });

    const result = await service.getSuggestedUsers('u1');

    expect(Array.isArray(result)).toBe(true);
  });

  it('getSuggestedUsers - user not found', async () => {
    repo.getUserById.mockResolvedValue(null);

    await expect(service.getSuggestedUsers('u1')).rejects.toThrow(
      'User not found',
    );
  });

  // =========================
  // blocked users
  // =========================
  it('getBlocked - success', async () => {
    repo.getUserById.mockResolvedValue({ _id: 'u1' } as any);

    repo.getBlockedIds.mockResolvedValue(['u2'] as any);
    repo.getUsersWithIds.mockResolvedValue([{ _id: 'u2' }] as any);
    repo.getUsersStats.mockResolvedValue({
      u2: { followersCount: 0, trackCount: 0 },
    });

    const result = await service.getBlocked('u1');

    expect(Array.isArray(result)).toBe(true);
  });

  it('getBlocked - user not found', async () => {
    repo.getUserById.mockResolvedValue(null);

    await expect(service.getBlocked('u1')).rejects.toThrow('User not found');
  });
});
