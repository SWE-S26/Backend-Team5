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
import {
  CreatePlaylistWithImageInput,
  UpdatePlaylistInfoInput,
} from './dtos/playlists.request';
import logger from '../../shared/logger/logger';
import { Types } from 'mongoose';

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
    limit: number = 5,
  ): Promise<PlaylistWithTracks | null> {
    const playlistWithTracks = await this.repository.findByIdWithTracks(
      id,
      userId,
      offset,
      limit,
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

    try {
      const playlist = await this.repository.create(
        playlistName,
        artistId,
        tracks,
        isPrivate,
        durationInSeconds,
      );

      return playlist;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permaLink')) {
        throw BadRequestError(
          'PermaLink taken, please choose another Display Name',
        );
      } else {
        throw error;
      }
    }
  }

  async createPlaylistWithImage(
    infoTotal: CreatePlaylistWithImageInput,
    artistId: string,
  ): Promise<IPlaylist> {
    const { title, description, listOfTracks, isPrivate } = infoTotal.body;

    const { imageFile } = infoTotal;
    const durationInSeconds =
      await this.repository.findTrackLengthesByIds(listOfTracks);
    if (durationInSeconds instanceof Error) {
      throw NotFoundError(durationInSeconds.message);
    }

    const uploadResult = await CloudinaryService.uploadImage(
      imageFile.buffer,
      ImageFolder.PLAYLIST,
    );

    try {
      const finalDescription = description || '';
      const playlist = await this.repository.createWithImage(
        title,
        artistId,
        listOfTracks.map((id) => new Types.ObjectId(id)),
        isPrivate,
        durationInSeconds,
        finalDescription,
      );

      const finalPlaylist = await this.updateImage(
        playlist._id.toString(),
        imageFile,
        artistId,
      );

      return finalPlaylist!;
    } catch (error) {
      await CloudinaryService.deleteImage(uploadResult.publicId);
      if (error instanceof Error && error.message.includes('permaLink')) {
        throw BadRequestError(
          'PermaLink taken, please choose another Display Name',
        );
      } else {
        throw error;
      }
    }
  }

  async addPlaylistToHistory(
    playlistId: string,
    userId: string,
  ): Promise<void> {
    const playlist = await this.repository.findById(playlistId);
    if (!playlist) {
      throw NotFoundError('Playlist not found');
    }
    await this.repository.addPlaylistToHistory(userId, playlistId);
  }

  async addTrackToPlaylist(
    playlistId: string,
    trackId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.repository.addTrackToEndOfPlaylist(
      trackId,
      playlistId,
      userId,
    );

    if (result instanceof Error) {
      throw BadRequestError(result.message);
    }
  }

  async removeTrackFromPlaylist(
    playlistId: string,
    trackId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.repository.removeTrackFromPlaylist(
      trackId,
      playlistId,
      userId,
    );

    if (result instanceof Error) {
      throw BadRequestError(result.message);
    }
  }

  async getAlbumsOfAnArtist(
    artistId: string,
    userId: string | null,
    limit = 5,
    offset = 1,
  ): Promise<IPlaylist[]> {
    const getAlbums = true;
    const albums = await this.repository.getPlaylistsForArtist(
      artistId,
      limit,
      offset,
      userId,
      getAlbums,
    );

    if (albums instanceof Error) {
      throw ForbiddenError(albums.message);
    }

    return albums;
  }

  async updatePlaylist(
    playlist: UpdatePlaylistInfoInput,
    userId: string,
  ): Promise<boolean> {
    const { id } = playlist.params;
    const { imageFile } = playlist;

    const isPermalinkTaken = await this.repository.isPlaylsitPermalinkTaken(
      playlist.body.permalink,
      userId,
      id,
    );

    if (isPermalinkTaken) {
      throw BadRequestError('Playlist permalink is already taken');
    }

    const updatedInfo = await this.repository.updatePlaylist(playlist);

    if (updatedInfo instanceof Error) {
      if (updatedInfo.message === 'You are not the owner of this playlist') {
        throw ForbiddenError(updatedInfo.message);
      } else if (updatedInfo.message.includes('permaLink')) {
        throw BadRequestError(updatedInfo.message);
      } else {
        throw NotFoundError(updatedInfo.message);
      }
    }

    await this.updateImage(id, imageFile, userId);
    return true;
  }

  async getByPermalink(
    permalink: string,
    userId: string | null,
  ): Promise<PlaylistWithTracks | null> {
    const playlist = await this.repository.findByPermalink(permalink, userId);
    if (!playlist) {
      throw NotFoundError('Playlist not found');
    }

    if (playlist instanceof Error) {
      if (playlist.message === 'You are blocked from accessing this playlist') {
        throw ForbiddenError(playlist.message);
      } else {
        throw NotFoundError(playlist.message);
      }
    }
    return playlist;
  }

  async getByPermaLinkAndProfileLink(
    permalink: string,
    profilelink: string,
    userId: string | null,
    limit: number = 5,
    offset: number = 1,
  ): Promise<PlaylistWithTracks | null> {
    const findUserIdResult =
      await this.repository.getUserIdByProfileLink(profilelink);
    if (!findUserIdResult) {
      throw NotFoundError('Profile not found');
    }

    const playlist = await this.repository.findByPermalinkWithProfileLink(
      permalink,
      findUserIdResult,
      userId,
      offset,
      limit,
    );
    if (!playlist) {
      throw NotFoundError('Playlist not found');
    }

    if (playlist instanceof Error) {
      if (playlist.message === 'You are blocked from accessing this playlist') {
        throw ForbiddenError(playlist.message);
      } else {
        throw NotFoundError(playlist.message);
      }
    }
    return playlist;
  }

  async updateImage(
    playlistId: string,
    imageFile: Express.Multer.File,
    userId: string,
  ): Promise<IPlaylist | void> {
    const playlist = await this.repository.findById(playlistId);
    if (!playlist) {
      throw NotFoundError('Playlist not found');
    }

    if (playlist.artistId.toString() !== userId) {
      throw ForbiddenError(
        'This is not your playlist, you cannot update its image',
      );
    }

    if (!imageFile) {
      return;
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
      userId,
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
    userId: string | null,
  ): Promise<IPlaylist[]> {
    const playlists = await this.repository.getMorePlaylistsFromSameArtist(
      artistId,
      excludePlaylistId,
      userId,
    );

    if (playlists instanceof Error) {
      throw NotFoundError(playlists.message);
    }

    return playlists;
  }

  async getMyPlaylists(
    artistId: string,
    offset: number = 1,
    limit: number = 5,
  ): Promise<IPlaylist[]> {
    if (!artistId) {
      throw BadRequestError('Artist Id is required to fetch playlists');
    }

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

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await this.repository.delete(id, userId);

    if (deleted instanceof Error) {
      throw NotFoundError(deleted.message);
    }

    return deleted;
  }
}
