import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors/responseErrors';
import { TracksRepository } from './tracks.repository';
import { Types } from 'mongoose';
import { TracksMapper } from './dtos/tracks.mapper';
import {
  TrackResponsePublicDTO,
  PaginationResponseDTO,
} from './dtos/tracks.response';
import { ITrack } from '../../shared/models/models.track';
import { CreateTrackDTO, UpdateTrackDTO } from './dtos/tracks.request.body';
import publitioMediaStorage from '../../shared/abstractions/publitio';
import {
  CloudinaryService,
  ImageFolder,
} from '../../shared/abstractions/cloudinary.service';
import { IAdvancedAudioDetails } from '../../shared/models/models.advanced-audio-details';
import { getNotificationSocketHandler } from '../../sockets/handlers/notification.handler';
import { parseBuffer } from 'music-metadata';
import logger from '../../shared/logger/logger';
import blobStorageService from '../../shared/abstractions/blob.service';
import {
  PlaylistWithTracks,
  TrackInPlaylist,
} from '../playlists/playlists.repository';
import Playlist from '../../shared/models/models.playlist';

type ImageInfo = {
  imgLink: string;
  publicId: string;
};

export class TracksService {
  private readonly tracksRepository: TracksRepository;
  private readonly trackUploader;
  private readonly imgUploader;

  constructor() {
    this.tracksRepository = new TracksRepository();
    this.trackUploader = publitioMediaStorage;
    this.imgUploader = CloudinaryService;
  }

  private async uploadImgToCloud(image: Express.Multer.File | null) {
    let imgInfo: ImageInfo | null = null;
    if (image) {
      const retreiveImgInfo = await this.imgUploader.uploadImage(
        image.buffer,
        ImageFolder.AUDIO,
      );
      imgInfo = {
        imgLink: retreiveImgInfo?.url as string,
        publicId: retreiveImgInfo?.publicId,
      };
      logger.info('[track]: Track Image Uploaded To Cloud');
    }
    return imgInfo;
  }

  private validateTrackOwnerShip(
    userId: string,
    posterId: string,
    userRole: string,
  ) {
    // if the user trying to delete is not
    if (userRole !== 'Admin') {
      if (userId !== posterId) {
        // means user is trying to delete a track he has not posted
        throw UnauthorizedError('Unauthorized Action');
      }
    }
    logger.info('[track]: validated User OwnerShip');
  }

  private async calculateTrackDuration(file: Express.Multer.File) {
    const metadata = await parseBuffer(file.buffer, file.mimetype);
    const duration = Math.ceil(metadata.format.duration as number);
    logger.info('[track]: Track Duration Calculated');
    return duration;
  }

  async deleteTrackById(
    userId: string,
    trackId: string,
    userRole: string,
  ): Promise<Boolean> {
    const searchTrack = await this.tracksRepository.findById(trackId);

    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }

    const posterId = searchTrack.posterId.toString();
    this.validateTrackOwnerShip(userId, posterId, userRole);

    // delete audio from cloud storage first
    await Promise.all([
      publitioMediaStorage.deleteAudioTrack(
        searchTrack.audio.id,
        searchTrack.audio.cloudIndex,
      ),
      blobStorageService.deleteWaveFromBlob(searchTrack._id),
    ]);
    logger.info('[track]: Delted Audio and Waveform');

    // delete track info from database
    const isDeleted = await this.tracksRepository.deleteById(trackId, userId);
    logger.info('[track]: Delted Track from Data Base');
    return isDeleted;
  }

  async getTrackById(
    trackId: string,
    requesterUserId: string | null,
  ): Promise<TrackResponsePublicDTO | null> {
    const searchTrack = await this.tracksRepository.findById(trackId);

    // if not found
    if (!searchTrack) {
      throw NotFoundError("Track Doesn't Exists");
    }

    const posterId = searchTrack.posterId.toString();
    if (searchTrack.basicInfo.isPrivate && posterId != requesterUserId) {
      throw ForbiddenError('Unauthorized Access');
    }

    if (searchTrack.hidden == true) {
      throw ForbiddenError('This Track Is Banned Cannot Access It');
    }

    let trackResponse;

    if (requesterUserId) {
      trackResponse = TracksMapper.toTrackResponsePrivate(
        searchTrack,
        requesterUserId,
      );
    } else {
      trackResponse = TracksMapper.toTrackResponsePublic(searchTrack);
    }

    return trackResponse;
  }

  async incrementTrackNumPlays(trackId: string): Promise<Boolean> {
    const searchTrack = await this.tracksRepository.findById(trackId);

    if (!searchTrack) {
      throw NotFoundError("Track Doesn't Exists");
    }
    return await this.tracksRepository.incrementNumPlays(trackId);
  }

  async getLikedTracks(
    userId: string,
    requesterUserId: string | null,
  ): Promise<TrackResponsePublicDTO[] | null> {
    const likedTracksList = await this.tracksRepository.getLikedTracks(userId);

    // no liked tracks for this user
    if (!likedTracksList) {
      return null;
    }
    logger.info(`[track]: fetched liked tracks for user ${userId}`);

    let trackResponseList: any;
    console.log(likedTracksList);
    if (requesterUserId) {
      logger.info(`[track Priavte]: fetched liked tracks for user ${userId}`);
      // if private endpoint, fetch tracks that are not banned, user private and belong to him
      // if he is not the owner don't get the private tracks
      const visibleLikedTracks = likedTracksList.filter(
        (track) =>
          track?.hidden !== true &&
          (!track?.basicInfo.isPrivate ||
            track.posterId.toString() === requesterUserId),
      );
      trackResponseList = TracksMapper.toTrackResponsePrivateList(
        visibleLikedTracks as ITrack[],
        requesterUserId,
      );
    } else {
      // if from public endpoint remove all private tracks
      logger.info(`[track Public]: fetched liked tracks for user ${userId}`);
      const visibleLikedTracks = likedTracksList.filter(
        (track) => !(track?.basicInfo.isPrivate || track?.hidden !== true),
      );
      console.log(visibleLikedTracks);
      trackResponseList = TracksMapper.toTrackResponsePublicList(
        visibleLikedTracks as ITrack[],
      );
    }

    return trackResponseList;
  }

  async uploadAudioTrack(
    trackInfo: CreateTrackDTO,
    audio: Express.Multer.File,
    image: Express.Multer.File | null,
    posterId: string,
  ): Promise<Boolean> {
    const [duration, audioInfo, imgInfo, searchTrack, userInfo] =
      await Promise.all([
        this.calculateTrackDuration(audio),
        this.trackUploader.uploadAudioTrack(audio),
        this.uploadImgToCloud(image),
        this.tracksRepository.trackExistsByPermalinkForUser(
          trackInfo.basicInfo.permalink,
          posterId,
        ),
        this.tracksRepository.findUserById(posterId),
      ]);

    // duration is less than preview time
    if (duration < 20) {
      trackInfo.advanced.audioClipStart = 0;
      trackInfo.advanced.audioClipStart = 0;
    }

    // if user already have this permalink
    if (searchTrack) {
      logger.info(
        '[track]: user has a permalink that already exists in his collection',
      );
      throw BadRequestError('permalink for this user Already Exists');
    }

    // check if user is in free tier and consumed all his quota
    if (
      userInfo?.role == 'Listener' &&
      (userInfo.uploads.length as number) == 3
    ) {
      logger.info('[track]: user of free tier has consumed all of his quota');
      throw BadRequestError('user is in free tier and consumed all his quota');
    }
    const trackId = new Types.ObjectId();
    const waveformLink = await blobStorageService.uploadWaveToBlob(
      audio,
      trackId,
    );

    const trackInput = TracksMapper.toTrackInput(
      trackInfo,
      audioInfo,
      imgInfo,
      new Types.ObjectId(posterId),
      duration,
      waveformLink,
    );

    await this.tracksRepository.createNewTrack(trackInput, trackId);
    logger.info('[track]: new track uploaded to db');

    // send user new notification about
    this.sendNewTrackSocketNotification(posterId, trackId.toString());
    logger.info('[track]: notifications sent to users');

    return true;
  }

  private sendNewTrackSocketNotification(actorId: string, trackId: string) {
    let notificationHandler;

    try {
      notificationHandler = getNotificationSocketHandler();
    } catch {
      return;
    }

    notificationHandler
      .sendNewTrackNotification(actorId, trackId)
      .catch((err) =>
        console.error('Failed to send new track socket notification:', err),
      );
  }

  async getTrackByPermalink(
    permalink: string,
    profileLink: string,
    requesterUserId: string | null,
  ) {
    const searchTrack = await this.tracksRepository.getTrackByProfilePermalink(
      permalink,
      profileLink,
    );
    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }

    if (searchTrack.hidden) {
      throw ForbiddenError('Track is Banned Cannot Access It');
    }

    let trackResponse;

    if (requesterUserId) {
      trackResponse = TracksMapper.toTrackResponsePrivate(
        searchTrack,
        requesterUserId,
      );
    } else {
      trackResponse = TracksMapper.toTrackResponsePublic(searchTrack);
    }

    return trackResponse;
  }

  async getPaginatedList(
    page: number,
    limit: number,
    requesterUserId: string | null,
  ): Promise<PaginationResponseDTO> {
    const { tracks, info } = await this.tracksRepository.getPaginatedList(
      page,
      limit,
    );

    let trackResponseList;

    if (requesterUserId) {
      const visibleTracks = tracks.filter(
        (track) =>
          track?.hidden !== true &&
          (!track?.basicInfo.isPrivate ||
            track.posterId.toString() === requesterUserId),
      );
      trackResponseList = TracksMapper.toTrackResponsePrivateList(
        visibleTracks as ITrack[],
        requesterUserId,
      );
    } else {
      const visibleTracks = tracks.filter(
        (track) => !track?.basicInfo.isPrivate && track?.hidden !== true,
      );
      trackResponseList = TracksMapper.toTrackResponsePublicList(visibleTracks);
    }
    return {
      tracks: trackResponseList,
      paginationInfo: {
        ...info,
      },
    };
  }

  async updateTrackInfo(
    trackInfo: UpdateTrackDTO,
    userId: string,
    userRole: string,
    image: Express.Multer.File | null,
  ) {
    const searchTrack = await this.tracksRepository.findById(trackInfo.id);

    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }

    const imgInfo = await this.uploadImgToCloud(image);

    const posterId = searchTrack.posterId.toString();

    this.validateTrackOwnerShip(userId, posterId, userRole);

    const updatedTrack = await this.tracksRepository.updateTrackInfo(
      trackInfo,
      imgInfo,
    );
    return TracksMapper.toTrackResponsePrivate(updatedTrack, userId);
  }

  async getUserPostedTracks(userId: string, requesterUserId: string | null) {
    const postedTracks = await this.tracksRepository.getPostedTracks(userId);
    let trackResponseList;
    if (requesterUserId) {
      const visibleTracks = postedTracks.filter(
        (track) =>
          track?.hidden !== true &&
          (!track?.basicInfo.isPrivate ||
            track.posterId.toString() === requesterUserId),
      );
      trackResponseList = TracksMapper.toTrackResponsePrivateList(
        visibleTracks,
        requesterUserId,
      );
    } else {
      const visibleTracks = postedTracks.filter(
        (track) => !(track?.basicInfo.isPrivate || track?.hidden !== true),
      );
      trackResponseList = TracksMapper.toTrackResponsePublicList(visibleTracks);
    }
    return trackResponseList;
  }

  async addToUserHistory(userId: string, trackId: string) {
    const searchTrack = await this.tracksRepository.findById(trackId);

    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }

    await this.tracksRepository.addToHistory(userId, trackId);
    return true;
  }

  async getTrackDetailedInfo(
    userId: string,
    trackId: string,
    userRole: string,
  ) {
    const searchTrack = await this.tracksRepository.findById(trackId);

    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }

    this.validateTrackOwnerShip(userId, trackId, userRole);

    const searchAdvancedInfo =
      await this.tracksRepository.getTrackAdvancedInfo(trackId);
    return TracksMapper.toTrackDetailedResponse(
      searchTrack,
      searchAdvancedInfo as IAdvancedAudioDetails,
    );
  }

  async isPermalinkFoundForUser(permalink: string, userId: string) {
    const searchTrack =
      await this.tracksRepository.trackExistsByPermalinkForUser(
        permalink,
        userId,
      );

    if (searchTrack) {
      return true;
    }
    return false;
  }

  async getUserQuota(userId: string) {
    const user = await this.tracksRepository.findUserById(userId);
    if (!user) throw NotFoundError('User not found');
    return user.uploads.length;
  }

  async getPlaylistsContainingTrack(
    trackId: string,
    requesterUserId: string | null,
    playlistType: string,
  ) {
    const playlists = await this.tracksRepository.getPlaylistsContainingTrack(
      trackId,
      playlistType,
    );

    if (!playlists) return null;
    if (requesterUserId) {
      // if private endpoint, fetch playlists that are user private and belong to him
      // if he is not the owner don't get the private playlists
      const visiblePlaylists = playlists.filter(
        (playlist) =>
          !playlist?.isPrivate ||
          playlist.artistId.toString() === requesterUserId,
      );
      return visiblePlaylists;
    } else {
      // if from public endpoint remove all private tracks
      const visiblePlaylists = playlists.filter(
        (playlist) => !playlist?.isPrivate,
      );
      return visiblePlaylists;
    }
  }
}
