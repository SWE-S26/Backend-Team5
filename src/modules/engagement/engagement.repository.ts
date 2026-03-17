import { Types } from 'mongoose';
import Track, { ITrack } from '../../shared/models/models.track';
import User from '../../shared/models/models.user';

export class EngagementRepository {
  async findTrackById(trackId: string): Promise<ITrack | null> {
    return Track.findById(trackId).select('likedBy numOfLikes');
  }

  async addLikeToTrack(trackId: string, userId: string): Promise<ITrack> {
    const userObjectId = new Types.ObjectId(userId);
    return Track.findByIdAndUpdate(
      trackId,
      { $addToSet: { likedBy: userObjectId }, $inc: { numOfLikes: 1 } },
      { new: true },
    ).select('numOfLikes') as Promise<ITrack>;
  }

  async removeLikeFromTrack(trackId: string, userId: string): Promise<ITrack> {
    const userObjectId = new Types.ObjectId(userId);
    return Track.findByIdAndUpdate(
      trackId,
      { $pull: { likedBy: userObjectId }, $inc: { numOfLikes: -1 } },
      { new: true },
    ).select('numOfLikes') as Promise<ITrack>;
  }

  async addTrackToUserLikes(userId: string, trackId: string): Promise<void> {
    const trackObjectId = new Types.ObjectId(trackId);
    await User.findByIdAndUpdate(userId, {
      $addToSet: { likedTracks: trackObjectId },
    });
  }

  async removeTrackFromUserLikes(userId: string, trackId: string): Promise<void> {
    const trackObjectId = new Types.ObjectId(trackId);
    await User.findByIdAndUpdate(userId, {
      $pull: { likedTracks: trackObjectId },
    });
  }
}
