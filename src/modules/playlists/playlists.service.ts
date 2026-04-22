import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors/responseErrors';
import { IPlaylist } from '../../shared/models/models.playlist';
import {
  PlaylistsRepository,
  PlaylistWithTracks,
} from './playlists.repository';
import {
  CloudinaryService,
  ImageFolder,
} from '../../shared/abstractions/cloudinary.service';
import { DEFAULT_PLAYLIST_IMAGE } from '../../config/constants';
import { PlaylistArtistDetailsDTOType } from './dtos/playlists.response';

const isDefaultImage = (publicId: string) => {
  return publicId === DEFAULT_PLAYLIST_IMAGE.publicId;
};

export class PlaylistsService {
  private readonly repository: PlaylistsRepository = new PlaylistsRepository();
  constructor() {}

  async findAll(
    offset: number,
    limit: number,
    userId: string | null,
  ): Promise<IPlaylist[]> {
    return this.repository.findAll(limit, offset, userId);
  }

  async findById(
    id: string,
    userId: string | null,
    offset: number = 1,
  ): Promise<PlaylistWithTracks | null> {
    const playlistWithTracks = await this.repository.findByIdWithTracks(
      id,
      userId,
      offset,
    );

    if (!playlistWithTracks) {
      throw NotFoundError('Playlist not found');
    }

    if (playlistWithTracks instanceof Error) {
      if (
        playlistWithTracks.message ===
        'You are blocked from accessing this playlist'
      ) {
        throw ForbiddenError(playlistWithTracks.message);
      } else {
        throw NotFoundError(playlistWithTracks.message);
      }
    }

    return playlistWithTracks;
  }

  async validateNumberOfPostedPlaylists(
    userId: string,
    role: string,
  ): Promise<void> {
    if (role === 'Pro') {
      return;
    }

    const numberOfPostedTracks =
      await this.repository.findNumberOfPostedPlaylists(userId);
    if (!numberOfPostedTracks) {
      throw NotFoundError('User not found');
    }

    if (numberOfPostedTracks.playlists.length >= 3) {
      throw ForbiddenError(
        'You have reached the maximum number of posted playlists allowed for your subscription. Please upgrade to Pro to post more playlists.',
      );
    }
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

  async updatePlaylist(playlist: IPlaylist): Promise<boolean> {
    return true;
  }

  async updateImage(
    playlistId: string,
    imageFile: Express.Multer.File,
    userId: string,
  ): Promise<IPlaylist> {
    const playlist = await this.repository.findById(playlistId);
    if (!playlist) {
      throw NotFoundError('Playlist not found');
    }

    if (playlist.artistId.toString() !== userId) {
      throw ForbiddenError(
        'This is not your playlist, you cannot update its image',
      );
    }

    const uploadResult = await CloudinaryService.uploadImage(
      imageFile.buffer,
      ImageFolder.PLAYLIST,
    );

    if (!isDefaultImage(playlist.image.publicId)) {
      await CloudinaryService.deleteImage(playlist.image.publicId);
    }

    const updatedPlaylist = await this.repository.updateImage(
      playlistId,
      uploadResult.url,
      uploadResult.publicId,
    );

    if (!updatedPlaylist) {
      throw NotFoundError('Playlist not found for updating');
    }

    return updatedPlaylist;
  }

  async getArtistDetails(
    artistId: string,
    userId: string | null,
  ): Promise<PlaylistArtistDetailsDTOType | null> {
    const artistDetails = await this.repository.getArtistDetails(
      artistId,
      userId,
    );

    if (!artistDetails) {
      throw NotFoundError('Artist not found');
    }

    return artistDetails;
  }

  async getMorePlaylistsFromArtist(
    artistId: string,
    excludePlaylistId: string,
  ): Promise<IPlaylist[]> {
    return this.repository.getMorePlaylistsFromSameArtist(
      artistId,
      excludePlaylistId,
    );
  }

  async getMyPlaylists(
    artistId: string,
    offset: number = 1,
    limit: number = 5,
  ): Promise<IPlaylist[]> {
    return this.repository.getMyPlaylists(artistId, offset, limit);
  }

  async getPlaylistsForArtist(
    artistId: string,
    offset: number = 1,
    limit: number = 5,
    userId: string | null,
  ): Promise<IPlaylist[] | Error> {
    const playlists = await this.repository.getPlaylistsForArtist(
      artistId,
      offset,
      limit,
      userId,
    );
    if (playlists instanceof Error) {
      throw ForbiddenError(playlists.message);
    }

    return playlists;
  }

  async updateOrderOfSingleTrack(
    playlistId: string,
    trackId: string,
    oldPosition: number,
    newPosition: number,
    userId: string,
  ): Promise<boolean> {
    const result = await this.repository.updateOrderOfSignleTrack(
      playlistId,
      trackId,
      oldPosition,
      newPosition,
      userId,
    );

    if (result instanceof Error) {
      if (
        result.message ===
        'You are not the owner of this playlist, you cannot update it'
      ) {
        throw ForbiddenError(result.message);
      } else {
        throw BadRequestError(result.message);
      }
    }

    return result;
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
