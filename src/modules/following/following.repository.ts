import User, { IUser } from '../../shared/models/models.user';
import Following from '../../shared/models/models.following';
import { imgSchema } from '../../shared/models/schemas.shared';
import Track from '../../shared/models/models.track';
import blockedListSchema from '../../shared/models/models.blocked-list';
import { Types } from 'mongoose';

export interface UserStats {
  trackCount: number;
  followersCount: number;
}

export class FollowingRepository {
  async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id).lean();
  }

  async getUserStats(id: string): Promise<UserStats> {
    const [followDoc, trackCount] = await Promise.all([
      Following.findOne({ userId: id }).lean(),
      Track.countDocuments({ posterId: id }),
    ]);

    const followersCount = followDoc?.followers.length ?? 0;

    return {
      followersCount,
      trackCount,
    };
  }

  async addFollower(id: string, followedId: string): Promise<void> {
    await Promise.all([
      Following.findOneAndUpdate(
        { userId: id },
        { $addToSet: { followed: followedId } },
        { upsert: true },
      ),
      Following.findOneAndUpdate(
        { userId: followedId },
        { $addToSet: { followers: id } },
        { upsert: true },
      ),
      blockedListSchema.findOneAndUpdate(
        { blockerId: id },
        { $pull: { blockedIds: followedId } },
      ),
    ]);
  }

  async removeFollower(id: string, followedId: string): Promise<void> {
    await Promise.all([
      Following.findOneAndUpdate(
        { userId: id },
        { $pull: { followed: followedId } },
      ),
      Following.findOneAndUpdate(
        { userId: followedId },
        { $pull: { followers: id } },
      ),
    ]);
  }

  async block(id: string, blockedId: string): Promise<void> {
    await Promise.all([
      blockedListSchema.findOneAndUpdate(
        { blockerId: id },
        { $addToSet: { blockedIds: blockedId } },
        { upsert: true },
      ),
      Following.findOneAndUpdate(
        { userId: id },
        { $pull: { followers: blockedId, followed: blockedId } },
      ),
      Following.findOneAndUpdate(
        { userId: blockedId },
        { $pull: { followers: id, followed: id } },
      ),
    ]);
  }

  async unblock(id: string, blockedId: string): Promise<void> {
    await blockedListSchema.findOneAndUpdate(
      { blockerId: id },
      { $pull: { blockedIds: blockedId } },
    );
  }

  async getUsersIds(
    id: string,
    field: 'followers' | 'followed',
    offset?: number,
    limit?: number,
  ): Promise<Types.ObjectId[]> {
    const projection: any = {};

    if (offset !== undefined && limit !== undefined) {
      projection[field] = { $slice: [offset, limit] };
    } else {
      projection[field] = 1;
    }
    const followDoc = await Following.findOne(
      { userId: id },
      projection,
    ).lean();
    return followDoc?.[field] ?? [];
  }

  async getSuggestedUserIds(id: string): Promise<Types.ObjectId[]> {
    const followDoc = await Following.findOne(
      { userId: id },
      { followed: { $slice: 30 } },
    ).lean();

    const followedIds = followDoc?.followed ?? [];

    const followedDocs = await Following.find(
      { userId: { $in: followedIds } },
      { followed: { $slice: 30 } },
    ).lean();

    const topTrackUsers = await User.aggregate([
      {
        $project: {
          _id: 1,
          trackCount: { $size: '$tracks' },
        },
      },
      {
        $sort: { trackCount: -1 },
      },
      {
        $limit: 30,
      },
    ]);

    const suggestedUsersIdsSet = new Set<string>();
    for (const doc of followedDocs) {
      for (const suggested of doc.followed ?? []) {
        const suggestedId = suggested.toString();
        if (suggestedId !== id) {
          suggestedUsersIdsSet.add(suggestedId);
        }
      }
    }

    topTrackUsers.forEach((topUser) => {
      const topUserId = topUser._id.toString();
      if (topUserId !== id) {
        suggestedUsersIdsSet.add(topUserId);
      }
    });

    if (suggestedUsersIdsSet.size < 30) {
      const anyUsers = await User.find({}, { _id: 1 }).limit(30).lean();
      anyUsers.forEach((user) => {
        const userId = user._id.toString();
        if (!suggestedUsersIdsSet.has(userId) && userId !== id) {
          suggestedUsersIdsSet.add(userId);
        }
      });
    }

    return Array.from(suggestedUsersIdsSet).map((id) => new Types.ObjectId(id));
  }

  async getBlockedIds(
    id: string,
    offset?: number,
    limit?: number,
  ): Promise<Types.ObjectId[]> {
    const projection: any = {};

    if (offset !== undefined && limit !== undefined) {
      projection['blockedIds'] = { $slice: [offset, limit] };
    } else {
      projection['blockedIds'] = 1;
    }

    const blockDoc = await blockedListSchema
      .findOne({ blockerId: id }, projection)
      .lean();
    return blockDoc?.blockedIds ?? [];
  }

  async getUsersWithIds(usersIds: Types.ObjectId[]): Promise<IUser[]> {
    return await User.find(
      { _id: { $in: usersIds } },
      { diaplayName: 1, profileImg: 1 },
    ).lean();
  }

  async getUsersStats(
    usersIds: Types.ObjectId[],
  ): Promise<Record<string, UserStats>> {
    const followersDocs = await Following.find(
      { userId: { $in: usersIds } },
      { userId: 1, followers: 1 },
    ).lean();
    const followersMap: Record<string, number> = {};
    followersDocs.forEach((doc) => {
      followersMap[doc.userId.toString()] = doc.followers?.length ?? 0;
    });

    const trackCounts = await Track.aggregate([
      { $match: { posterId: { $in: usersIds } } },
      { $group: { _id: '$posterId', count: { $sum: 1 } } },
    ]);

    const trackMap: Record<string, number> = {};

    trackCounts.forEach((tc) => {
      trackMap[tc._id.toString()] = tc.count;
    });

    const statsMap: Record<string, UserStats> = {};
    usersIds.forEach((id) => {
      const idStr = id.toString();
      statsMap[idStr] = {
        followersCount: followersMap[idStr] ?? 0,
        trackCount: trackMap[idStr] ?? 0,
      };
    });

    return statsMap;
  }

  async amIBlocked(userId: string, followedId: string): Promise<boolean> {
    const blockDoc = await blockedListSchema
      .findOne({ blockerId: followedId, blockedIds: userId })
      .lean();
    return !!blockDoc;
  }

  async getUsersWhoBlockedMe(userId: string): Promise<Types.ObjectId[]> {
    const docs = await blockedListSchema
      .find({ blockedIds: userId }, { blockerId: 1 })
      .lean();

    return docs.map((doc) => doc.blockerId);
  }
}
