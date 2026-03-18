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

  async addRepostToTrack(trackId: string): Promise<ITrack> {
    return Track.findByIdAndUpdate(
      trackId,
      { $inc: { numberOfReposts: 1 } },
      { new: true },
    ).select('numberOfReposts') as Promise<ITrack>;
  }

  async removeRepostFromTrack(trackId: string): Promise<ITrack> {
    return Track.findByIdAndUpdate(
      trackId,
      { $inc: { numberOfReposts: -1 } },
      { new: true },
    ).select('numberOfReposts') as Promise<ITrack>;
  }

  async findUserReposts(userId: string): Promise<IUser['reposts'] | null> {
    const user = await User.findById(userId).select('reposts');
    return user?.reposts || null;
  }

  async addRepostToUser(
    userId: string,
    trackId: string,
    caption?: string,
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $push: {
        reposts: {
          id: trackId,
          caption: caption || '',
          type: 'track',
          timestamp: new Date(),
        },
      },
    });
  }

  async removeRepostFromUser(userId: string, trackId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { reposts: { id: trackId, type: 'track' } },
    });
  }

  async findUserTrackRepost(
    userId: string,
    trackId: string,
  ): Promise<IUser['reposts'][number] | null> {
    const user = await User.findById(userId).select('reposts');
    if (!user?.reposts) return null;

    const repost = user.reposts.find(
      (r) => r.id === trackId && r.type === 'track',
    );
    return repost || null;
  }

  async updateRepostCaption(
    userId: string,
    trackId: string,
    caption: string,
  ): Promise<void> {
    await User.findOneAndUpdate(
      {
        _id: userId,
        'reposts.id': trackId,
        'reposts.type': 'track',
      },
      {
        $set: {
          'reposts.$.caption': caption,
        },
      },
    );
  }

  async addRepostToPlaylist(playlistId: string): Promise<IPlaylist> {
    return Playlist.findByIdAndUpdate(
      playlistId,
      { $inc: { numOfReposts: 1 } },
      { new: true },
    ).select('numOfReposts') as Promise<IPlaylist>;
  }

  async removeRepostFromPlaylist(playlistId: string): Promise<IPlaylist> {
    return Playlist.findByIdAndUpdate(
      playlistId,
      { $inc: { numOfReposts: -1 } },
      { new: true },
    ).select('numOfReposts') as Promise<IPlaylist>;
  }

  async addPlaylistRepostToUser(
    userId: string,
    playlistId: string,
    caption?: string,
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $push: {
        reposts: {
          id: playlistId,
          caption: caption || '',
          type: 'playlist',
          timestamp: new Date(),
        },
      },
    });
  }

  async removePlaylistRepostFromUser(
    userId: string,
    playlistId: string,
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { reposts: { id: playlistId, type: 'playlist' } },
    });
  }

  async findUserPlaylistRepost(
    userId: string,
    playlistId: string,
  ): Promise<IUser['reposts'][number] | null> {
    const user = await User.findById(userId).select('reposts');
    if (!user?.reposts) return null;

    const repost = user.reposts.find(
      (r) => r.id === playlistId && r.type === 'playlist',
    );
    return repost || null;
  }

  async updatePlaylistRepostCaption(
    userId: string,
    playlistId: string,
    caption: string,
  ): Promise<void> {
    await User.findOneAndUpdate(
      {
        _id: userId,
        'reposts.id': playlistId,
        'reposts.type': 'playlist',
      },
      {
        $set: {
          'reposts.$.caption': caption,
        },
      },
    );
  }

  async findTrackReposters(
    trackId: string,
    page: number,
    limit: number,
  ): Promise<{
    users: Pick<IUser, '_id' | 'displayName' | 'profileImg'>[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, countResult] = await Promise.all([
      User.find({
        reposts: {
          $elemMatch: {
            id: trackId,
            type: 'track',
          },
        },
      })
        .select('_id displayName profileImg')
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({
        reposts: {
          $elemMatch: {
            id: trackId,
            type: 'track',
          },
        },
      }),
    ]);

    return {
      users: users as Pick<IUser, '_id' | 'displayName' | 'profileImg'>[],
      total: countResult,
    };
  }

  async findPlaylistReposters(
    playlistId: string,
    page: number,
    limit: number,
  ): Promise<{
    users: Pick<IUser, '_id' | 'displayName' | 'profileImg'>[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, countResult] = await Promise.all([
      User.find({
        reposts: {
          $elemMatch: {
            id: playlistId,
            type: 'playlist',
          },
        },
      })
        .select('_id displayName profileImg')
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({
        reposts: {
          $elemMatch: {
            id: playlistId,
            type: 'playlist',
          },
        },
      }),
    ]);

    return {
      users: users as Pick<IUser, '_id' | 'displayName' | 'profileImg'>[],
      total: countResult,
    };
  }
}
