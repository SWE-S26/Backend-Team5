import { FollowingRepository, UserStats } from './following.repository';
import User, { IUser } from '../../shared/models/models.user';
import Following from '../../shared/models/models.following';
import Track from '../../shared/models/models.track';
import { UserSummaryDTOType } from './dtos/following.response';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../../shared/errors/responseErrors';
import { FollowingMapper } from './dtos/following.mapper';
import { Types } from 'mongoose';
import { getNotificationSocketHandler } from '../../sockets/handlers/notification.handler';

export class FollowingService {
  constructor(private readonly repository: FollowingRepository) {}

  async addFollower(
    userId: string,
    followedId: string,
  ): Promise<UserSummaryDTOType> {
    const existingUser: IUser | null =
      await this.repository.getUserById(userId);
    if (!existingUser) throw NotFoundError('User not found');
    const followedUser: IUser | null =
      await this.repository.getUserById(followedId);
    if (!followedUser)
      throw NotFoundError('User you want to follow is not found');
    if (userId === followedId)
      throw BadRequestError('You cannot follow yourself');
    const isBlocked = await this.repository.amIBlocked(userId, followedId);
    if (isBlocked) {
      throw ForbiddenError(
        'You cannot follow this user because they have blocked you',
      );
    }

    const wasFollowing = await this.repository.isFollowing(userId, followedId);

    await this.repository.addFollower(userId, followedId);

    if (!wasFollowing) {
      this.sendFollowSocketNotification(userId, followedId);
    }

    const userStats: UserStats = await this.repository.getUserStats(followedId);

    return FollowingMapper.toUserSummary({ ...followedUser, ...userStats });
  }

  private sendFollowSocketNotification(
    actorId: string,
    followedUserId: string,
  ): void {
    let notificationHandler;

    try {
      notificationHandler = getNotificationSocketHandler();
    } catch {
      return;
    }

    notificationHandler
      .sendFollowNotification(actorId, followedUserId)
      .catch((error) =>
        console.error('Failed to send follow socket notification:', error),
      );
  }

  async removeFollower(
    userId: string,
    followedId: string,
  ): Promise<UserSummaryDTOType> {
    const existingUser: IUser | null =
      await this.repository.getUserById(userId);
    if (!existingUser) throw NotFoundError('User not found');
    const followedUser: IUser | null =
      await this.repository.getUserById(followedId);
    if (!followedUser)
      throw NotFoundError('User you want to unfollow is not found');

    await this.repository.removeFollower(userId, followedId);

    const userStats: UserStats = await this.repository.getUserStats(followedId);

    return FollowingMapper.toUserSummary({ ...followedUser, ...userStats });
  }

  async block(userId: string, blockedId: string): Promise<UserSummaryDTOType> {
    const existingUser: IUser | null =
      await this.repository.getUserById(userId);
    if (!existingUser) throw NotFoundError('User not found');

    const blockedUser: IUser | null =
      await this.repository.getUserById(blockedId);
    if (!blockedUser)
      throw NotFoundError('User you want to block is not found');

    if (userId === blockedId)
      throw BadRequestError('You cannot block yourself');

    await this.repository.block(userId, blockedId);
    const userStats: UserStats = await this.repository.getUserStats(blockedId);

    return FollowingMapper.toUserSummary({ ...blockedUser, ...userStats });
  }

  async unblock(
    userId: string,
    blockedId: string,
  ): Promise<UserSummaryDTOType> {
    const existingUser: IUser | null =
      await this.repository.getUserById(userId);
    if (!existingUser) throw NotFoundError('User not found');

    const blockedUser: IUser | null =
      await this.repository.getUserById(blockedId);
    if (!blockedUser)
      throw NotFoundError('User you want to unblock is not found');

    await this.repository.unblock(userId, blockedId);
    const userStats: UserStats = await this.repository.getUserStats(blockedId);

    return FollowingMapper.toUserSummary({ ...blockedUser, ...userStats });
  }

  async getFollowers(
    id: string,
    offset = 0,
    limit = 20,
  ): Promise<UserSummaryDTOType[]> {
    const existingUser = await this.repository.getUserById(id);
    if (!existingUser) throw NotFoundError('User not found');

    const userIds: Types.ObjectId[] = await this.repository.getUsersIds(
      id,
      'followers',
      offset,
      limit,
    );
    const users: IUser[] = await this.repository.getUsersWithIds(userIds);
    const usersStats: Record<string, UserStats> =
      await this.repository.getUsersStats(userIds);

    const combined = users.map((user) => ({
      ...user,
      ...usersStats[user._id.toString()],
    }));

    const followers: UserSummaryDTOType[] = combined.map((user) =>
      FollowingMapper.toUserSummary(user),
    );

    return followers;
  }

  async getFollowed(
    id: string,
    offset = 0,
    limit = 20,
  ): Promise<UserSummaryDTOType[]> {
    const existingUser = await this.repository.getUserById(id);
    if (!existingUser) throw NotFoundError('User not found');

    const userIds: Types.ObjectId[] = await this.repository.getUsersIds(
      id,
      'followed',
      offset,
      limit,
    );
    const users: IUser[] = await this.repository.getUsersWithIds(userIds);
    const usersStats: Record<string, UserStats> =
      await this.repository.getUsersStats(userIds);

    const combined = users.map((user) => ({
      ...user,
      ...usersStats[user._id.toString()],
    }));

    const followed: UserSummaryDTOType[] = combined.map((user) =>
      FollowingMapper.toUserSummary(user),
    );

    return followed;
  }

  async getSuggestedUsers(
    id: string,
    offset = 0,
    limit = 20,
  ): Promise<UserSummaryDTOType[]> {
    const existingUser = await this.repository.getUserById(id);
    if (!existingUser) throw NotFoundError('User not found');

    const suggestedUsersIds: Types.ObjectId[] =
      await this.repository.getSuggestedUserIds(id);

    const followedId: Types.ObjectId[] = await this.repository.getUsersIds(
      id,
      'followed',
    );

    const blockedByMeIds: Types.ObjectId[] =
      await this.repository.getBlockedIds(id);

    const blockedMeIds: Types.ObjectId[] =
      await this.repository.getUsersWhoBlockedMe(id);

    const followedSet = new Set(followedId.map((id) => id.toString()));
    const blockedByMeSet = new Set(blockedByMeIds.map((id) => id.toString()));
    const blockedMeSet = new Set(blockedMeIds.map((id) => id.toString()));

    const filtered = suggestedUsersIds.filter((userId) => {
      const idStr = userId.toString();
      return (
        !followedSet.has(idStr) &&
        !blockedByMeSet.has(idStr) &&
        !blockedMeSet.has(idStr)
      );
    });

    const userIds = filtered.slice(offset, offset + limit);

    const users: IUser[] = await this.repository.getUsersWithIds(userIds);
    const usersStats: Record<string, UserStats> =
      await this.repository.getUsersStats(userIds);

    const combined = users.map((user) => ({
      ...user,
      ...usersStats[user._id.toString()],
    }));

    const suggested: UserSummaryDTOType[] = combined.map((user) =>
      FollowingMapper.toUserSummary(user),
    );

    return suggested;
  }

  async getBlocked(
    id: string,
    offset = 0,
    limit = 20,
  ): Promise<UserSummaryDTOType[]> {
    const existingUser = await this.repository.getUserById(id);
    if (!existingUser) throw NotFoundError('User not found');

    const userIds: Types.ObjectId[] = await this.repository.getBlockedIds(
      id,
      offset,
      limit,
    );
    const users: IUser[] = await this.repository.getUsersWithIds(userIds);
    const usersStats: Record<string, UserStats> =
      await this.repository.getUsersStats(userIds);

    const combined = users.map((user) => ({
      ...user,
      ...usersStats[user._id.toString()],
    }));

    const blocked: UserSummaryDTOType[] = combined.map((user) =>
      FollowingMapper.toUserSummary(user),
    );

    return blocked;
  }
}
