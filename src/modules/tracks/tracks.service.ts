import {
  BadRequestError,
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

    // if the user trying to delete is not
    if (userRole !== 'Admin') {
      if (userId !== posterId) {
        // means user is trying to delete a track he has not posted
        throw UnauthorizedError('Unauthorized Action');
      }
    }

    // delete audio from cloud storage first
    publitioMediaStorage.deleteAudioTrack(
      searchTrack.audio.id,
      searchTrack.audio.cloudIndex,
    );

    await blobStorageService.deleteWaveFromBlob(searchTrack._id);

    // delete track info from database
    const isDeleted = await this.tracksRepository.deleteById(trackId, userId);
    return isDeleted;
  }

  async getTrackById(
    trackId: string,
    userId: string,
    requesterUserId: string | null,
  ): Promise<TrackResponsePublicDTO | null> {
    const searchTrack = await this.tracksRepository.findById(trackId);

    // if not found
    if (!searchTrack) {
      throw NotFoundError("Track Doesn't Exists");
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

    let trackResponseList: any;

    if (requesterUserId) {
      trackResponseList = TracksMapper.toTrackResponsePrivateList(
        likedTracksList as ITrack[],
        requesterUserId,
      );
    } else {
      trackResponseList = TracksMapper.toTrackResponsePublicList(
        likedTracksList as ITrack[],
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
        this.tracksRepository.getTrackByPermalink(
          trackInfo.basicInfo.permalink,
        ),
        this.tracksRepository.findUserById(posterId),
      ]);

    // duration is less than preview time
    if (duration < 20) {
      trackInfo.advanced.audioClipStart = 0;
      trackInfo.advanced.audioClipStart = 0;
    }

    // if user already have this permalink
    if (searchTrack && searchTrack.posterId.toString() == posterId) {
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
    userId: string,
    requesterUserId: string | null,
  ) {
    const searchTrack =
      await this.tracksRepository.getTrackByPermalink(permalink);
    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
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
      trackResponseList = TracksMapper.toTrackResponsePrivateList(
        tracks as ITrack[],
        requesterUserId,
      );
    } else {
      trackResponseList = TracksMapper.toTrackResponsePublicList(
        tracks as ITrack[],
      );
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

    // TODO: REFACTOR THIS PART : MAKE IT DRY
    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }

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
    }

    const posterId = searchTrack.posterId.toString();

    // if the user trying to delete is not
    if (userRole !== 'Admin') {
      if (userId !== posterId) {
        // means user is trying to delete a track he has not posted
        throw UnauthorizedError('Unauthorized Action');
      }
    }
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
      trackResponseList = TracksMapper.toTrackResponsePrivateList(
        postedTracks,
        requesterUserId,
      );
    } else {
      trackResponseList = TracksMapper.toTrackResponsePublicList(postedTracks);
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

    const posterId = searchTrack.posterId.toString();

    // if the user trying to delete is not
    if (userRole !== 'Admin') {
      if (userId !== posterId) {
        // means user is trying to delete a track he has not posted
        throw UnauthorizedError('Unauthorized Action');
      }
    }

    const searchAdvancedInfo =
      await this.tracksRepository.getTrackAdvancedInfo(trackId);
    return TracksMapper.toTrackDetailedResponse(
      searchTrack,
      searchAdvancedInfo as IAdvancedAudioDetails,
    );
  }
}
