import { Types } from 'mongoose';
import Track, { ITrack } from '../../shared/models/models.track';
import Playlist, { IPlaylist } from '../../shared/models/models.playlist';
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

  async removeTrackFromUserLikes(
    userId: string,
    trackId: string,
  ): Promise<void> {
    const trackObjectId = new Types.ObjectId(trackId);
    await User.findByIdAndUpdate(userId, {
      $pull: { likedTracks: trackObjectId },
    });
  }

  // ─── Playlist likes ─────────────────────────────────────────────────────────

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
