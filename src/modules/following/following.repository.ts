import User, { IUser } from '../../shared/models/models.user';
import Following from '../../shared/models/models.following';
import { imgSchema } from '../../shared/models/schemas.shared';
import Track from '../../shared/models/models.track';
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

  async getUsersIds(
    id: string,
    field: 'followers' | 'followed',
    offset = 0,
    limit = 20,
  ): Promise<Types.ObjectId[]> {
    const followDoc = await Following.findOne(
      { userId: id },
      { [field]: { $slice: [offset, limit] } },
    ).lean();
    return followDoc?.[field] ?? [];
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
      { usersId: { $in: usersIds } },
      { followers: 1 },
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
}
