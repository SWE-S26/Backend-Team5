import {
  BadRequestError,
  NotFoundError,
} from '../../shared/errors/responseErrors';
import { IPlaylist } from '../../shared/models/models.playlist';
import { PlaylistsRepository } from './playlists.repository';

export class PlaylistsService {
  private readonly repository: PlaylistsRepository = new PlaylistsRepository();
  constructor() {}

  async findAll(offset: number, limit: number): Promise<IPlaylist[]> {
    return this.repository.findAll(limit, offset);
  }

  async findById(id: string): Promise<IPlaylist | null> {
    const playlist = await this.repository.findById(id);
    if (!playlist) {
      throw NotFoundError('Playlist not found');
    }

    return playlist;
  }

  async create(
    playlistName: string,
    artistId: string,
    tracks: any[],
    isPrivate: boolean,
  ): Promise<IPlaylist> {
    const durationInSeconds =
      await this.repository.findTrackLengthesByIds(tracks);

    if (durationInSeconds instanceof Error) {
      throw NotFoundError(durationInSeconds.message);
    }

    return this.repository.create(
      playlistName,
      artistId,
      tracks,
      isPrivate,
      durationInSeconds,
    );
  }

  // async update(id: string, data: any): Promise<IPlaylist | null> {
  //   // return this.repository.update(id, data);
  // }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
