import { Types } from 'mongoose';
import Playlist, { IPlaylist } from '../../shared/models/models.playlist';
import Track from '../../shared/models/models.track';
export class PlaylistsRepository {
  async findAll(limit: number, offset: number): Promise<IPlaylist[]> {
    return await Playlist.find().skip(offset).limit(limit).lean().exec();
  }

  async findById(id: string): Promise<IPlaylist | null> {
    return await Playlist.findByIdCached(id);
  }

  async findTrackLengthesByIds(ids: string[]): Promise<number | Error> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const tracks = await Track.find({ _id: { $in: objectIds } })
      .select('durationInSeconds')
      .lean()
      .exec();
    if (tracks.length !== ids.length) {
      return new Error('One or more tracks not found');
    }
    return tracks.reduce((total, track) => total + track.durationInSeconds, 0);
  }

  async findTracksOfPlaylist(
    ids: string[],
  ): Promise<{ _id: Types.ObjectId; durationInSeconds: number }[]> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    return await Track.find({ _id: { $in: objectIds } })
      .select('_id durationInSeconds')
      .lean()
      .exec();
  }

  async create(
    playlistName: string,
    artistId: string,
    tracks: Types.ObjectId[],
    isPrivate: boolean,
    playlistDuration: number,
  ): Promise<IPlaylist> {
    const playlist = new Playlist({
      title: playlistName,
      artistId,
      listOfTracks: tracks,
      isPrivate,
      playlistLengthInSeconds: playlistDuration,
    });
    return (await playlist.save()).toObject() as IPlaylist;
  }

  async delete(playlistId: string): Promise<boolean> {
    const deleted = await Playlist.findByIdAndDelete(playlistId).exec();
    return deleted !== null;
  }
}
