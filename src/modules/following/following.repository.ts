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
}
