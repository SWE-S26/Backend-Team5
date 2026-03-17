import { Types } from 'mongoose';
import Track, { ITrack } from '../../shared/models/models.track';
import Playlist, { IPlaylist } from '../../shared/models/models.playlist';
import User, { IUser } from '../../shared/models/models.user';
import Following from '../../shared/models/models.following';

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

  async removeTrackFromUserLikes(
    userId: string,
    trackId: string,
  ): Promise<void> {
    const trackObjectId = new Types.ObjectId(trackId);
    await User.findByIdAndUpdate(userId, {
      $pull: { likedTracks: trackObjectId },
    });
  }

  async findTrackLikers(
    userIds: Types.ObjectId[],
  ): Promise<Pick<IUser, '_id' | 'displayName' | 'profileImg'>[]> {
    return User.find({
      _id: { $in: userIds },
    }).select('_id displayName profileImg');
  }

  async findFollowersCountByUserIds(
    userIds: Types.ObjectId[],
  ): Promise<Record<string, number>> {
    const rows = await Following.aggregate<{
      userId: Types.ObjectId;
      followersCount: number;
    }>([
      { $match: { userId: { $in: userIds } } },
      {
        $project: {
          _id: 0,
          userId: 1,
          followersCount: { $size: { $ifNull: ['$followers', []] } },
        },
      },
    ]);

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.userId.toString()] = row.followersCount;
      return acc;
    }, {});
  }

  async findPlaylistById(playlistId: string): Promise<IPlaylist | null> {
    return Playlist.findById(playlistId).select('likedUser numOfLikes');
  }

  async addLikeToPlaylist(
    playlistId: string,
    userId: string,
  ): Promise<IPlaylist> {
    const userObjectId = new Types.ObjectId(userId);
    return Playlist.findByIdAndUpdate(
      playlistId,
      { $addToSet: { likedUser: userObjectId }, $inc: { numOfLikes: 1 } },
      { new: true },
    ).select('numOfLikes') as Promise<IPlaylist>;
  }

  async removeLikeFromPlaylist(
    playlistId: string,
    userId: string,
  ): Promise<IPlaylist> {
    const userObjectId = new Types.ObjectId(userId);
    return Playlist.findByIdAndUpdate(
      playlistId,
      { $pull: { likedUser: userObjectId }, $inc: { numOfLikes: -1 } },
      { new: true },
    ).select('numOfLikes') as Promise<IPlaylist>;
  }

  async addPlaylistToUserLikes(
    userId: string,
    playlistId: string,
  ): Promise<void> {
    const playlistObjectId = new Types.ObjectId(playlistId);
    await User.findByIdAndUpdate(userId, {
      $addToSet: { likedPlaylists: playlistObjectId },
    });
  }

  async removePlaylistFromUserLikes(
    userId: string,
    playlistId: string,
  ): Promise<void> {
    const playlistObjectId = new Types.ObjectId(playlistId);
    await User.findByIdAndUpdate(userId, {
      $pull: { likedPlaylists: playlistObjectId },
    });
  }
}
