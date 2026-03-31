import User, { IUser } from '../../shared/models/models.user';
import Following from '../../shared/models/models.following';
import Track from '../../shared/models/models.track';

export interface UserStats {
  trackCount: number;
  followersCount: number;
}

export class FollowingRepository {
  async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id).lean();
  }

  async getUserStats(id: string): Promise<UserStats> {
    const followDoc = await Following.findOne({ userId: id }).lean();
    const followersCount = followDoc?.followers.length ?? 0;
    const trackCount = await Track.countDocuments({ posterId: id });

    return {
      followersCount,
      trackCount,
    };
  }

  async addFollower(id: string, followedId: string): Promise<void> {
    await Following.findOneAndUpdate(
      { userId: id },
      { $addToSet: { followed: followedId } },
      { upsert: true },
    );

    await Following.findOneAndUpdate(
      { userId: followedId },
      { $addToSet: { followers: id } },
      { upsert: true },
    );
  }
}
