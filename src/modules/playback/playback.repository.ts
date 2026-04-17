import { NotFoundError } from '../../shared/errors/responseErrors';
import History, { IHistory } from '../../shared/models/models.history';
import Track, { ITrack } from '../../shared/models/models.track';

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

  async create(data: any): Promise<any> {
    // TODO: insert into your data source
    return data;
  }

  async update(id: string, data: any): Promise<any | null> {
    // TODO: update in your data source
    return null;
  }

  async delete(id: string): Promise<boolean> {
    // TODO: delete from your data source
    return false;
  }
}
