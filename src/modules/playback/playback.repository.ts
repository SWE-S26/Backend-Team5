import { NotFoundError } from '../../shared/errors/responseErrors';
import History, { IHistory } from '../../shared/models/models.history';
import Playlist, { IPlaylist } from '../../shared/models/models.playlist';
import Track, { ITrack } from '../../shared/models/models.track';
import User, { IUser } from '../../shared/models/models.user';

export class PlaybackRepository {
  async getUserHistoryTracks(userId: string): Promise<ITrack[]> {
    const userHistory = await History.findOne({ userId: userId });

    if (!userHistory) {
      throw NotFoundError('No History Yet');
    }

    const sortedHistory = userHistory.historyTracks.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
    const trackIds = sortedHistory.map((entry) => entry.trackId);

    const tracks = await Track.find({ _id: { $in: trackIds } });

    const tracksMap = new Map(tracks.map((t) => [t._id.toString(), t]));
    const orderedTracks = trackIds
      .map((id) => tracksMap.get(id.toString()))
      .filter((track) => track !== undefined) as ITrack[];

    return orderedTracks;
  }

  async getUserHistoryPlaylists(userId: string): Promise<IPlaylist[]> {
    const userHistory = await History.findOne({ userId: userId });

    if (!userHistory) {
      throw NotFoundError('No History Yet');
    }

    const sortedHistory = userHistory.recentlyPlayed.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
    const playlistIds = sortedHistory.map((entry) => entry.playlistId);

    const playlists = await Playlist.find({ _id: { $in: playlistIds } });

    const playlistsMap = new Map(playlists.map((t) => [t._id.toString(), t]));
    const orderedTracks = playlistIds
      .map((id) => playlistsMap.get(id.toString()))
      .filter((playlist) => playlist !== undefined) as IPlaylist[];

    return orderedTracks;
  }

  async findUserById(userId: string): Promise<IUser | null> {
    return await User.findById<IUser>(userId);
  }

  async deleteUserHistory(userId: string): Promise<void> {
    await History.findOneAndUpdate(
      { userId },
      {
        $set: {
          recentlyPlayed: [],
          historyTracks: [],
        },
      },
    );
  }
}
