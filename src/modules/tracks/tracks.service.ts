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
import {
  CreateTrackDTO,
  CreateTrackDTOV2,
  UpdateTrackDTO,
  UpdateTrackDTOV2,
} from './dtos/tracks.request.body';
import publitioMediaStorage from '../../shared/abstractions/publitio.service';
import {
  CloudinaryService,
  ImageFolder,
} from '../../shared/abstractions/cloudinary.service';
import { IAdvancedAudioDetails } from '../../shared/models/models.advanced-audio-details';
import { getNotificationSocketHandler } from '../../sockets/handlers/notification.handler';
import { parseBuffer } from 'music-metadata';
import logger from '../../shared/logger/logger';
import blobStorageService from '../../shared/abstractions/blob.service';
import { ValidCountries, ValidRegions, Country, Region } from './tracks.consts';
import { redisCacher } from '../../shared/abstractions/redis/redisCacher';

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

  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
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
        (track) => !track?.basicInfo.isPrivate && track?.hidden !== true,
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
        trackInfo.basicInfo.permalink
          ? this.tracksRepository.trackExistsByPermalinkForUser(
              trackInfo.basicInfo.permalink,
              posterId,
            )
          : null,
        this.tracksRepository.findUserById(posterId),
      ]);

    if (trackInfo.basicInfo.permalink === '') {
      const seconds = Math.floor(Date.now() / 1000);
      trackInfo.basicInfo.permalink =
        trackInfo.basicInfo.title
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_-]/g, '') +
        '_' +
        seconds.toLocaleString();
    }

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
        (track) => !track?.basicInfo.isPrivate && track?.hidden !== true,
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

    this.validateTrackOwnerShip(
      userId,
      searchTrack.posterId.toString(),
      userRole,
    );

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

  // ============================================== V2 =============================================

  async uploadAudioTrackV2(
    trackInfo: CreateTrackDTOV2,
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
      trackInfo.advanced.audioClipEnd = 0;
    }

    if (searchTrack) {
      // if user already have this permalink
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

    if (
      trackInfo.geoBlocking &&
      trackInfo.geoBlocking.mode !== 'worldwide' &&
      userInfo &&
      userInfo.role == 'Listener'
    ) {
      throw ForbiddenError('GeoBlocking Allowed For Pro');
    }

    const trackId = new Types.ObjectId();
    const waveformLink = await blobStorageService.uploadWaveToBlob(
      audio,
      trackId,
    );

    const trackInput = TracksMapper.toTrackInputV2(
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

  async updateTrackInfoV2(
    trackInfo: UpdateTrackDTOV2,
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

    if (
      trackInfo.geoBlocking &&
      trackInfo.geoBlocking.mode !== 'worldwide' &&
      userRole == 'Listener'
    ) {
      throw ForbiddenError('GeoBlocking Allowed For Pro');
    }

    await this.tracksRepository.updateTrackInfo(trackInfo, imgInfo);
    return true;
  }

  async getTrackByIdV2(
    trackId: string,
    requesterUserId: string | null,
  ): Promise<TrackResponsePublicDTO | null> {
    const [searchTrack, user] = await Promise.all([
      this.tracksRepository.findById(trackId),
      requesterUserId
        ? this.tracksRepository.findUserById(requesterUserId)
        : null,
    ]);

    // if not found
    if (!searchTrack) {
      throw NotFoundError("Track Doesn't Exists");
    }

    if (searchTrack.hidden == true) {
      throw ForbiddenError('This Track Is Banned Cannot Access It');
    }

    const posterId = searchTrack.posterId.toString();
    if (searchTrack.basicInfo.isPrivate && posterId != requesterUserId) {
      throw ForbiddenError('Unauthorized Access');
    }

    if (!requesterUserId && searchTrack.geoBlocking.mode !== 'worldwide') {
      throw ForbiddenError('Track is Restricted By Region');
    }

    if (requesterUserId) {
      const repostedTracks =
        user?.reposts
          ?.filter((repost) => repost.type === 'track')
          .map((repost) => repost.id) ?? [];

      return TracksMapper.toTrackResponsePrivateV2(
        searchTrack,
        requesterUserId,
        user?.country ?? '',
        repostedTracks,
      );
    }

    return TracksMapper.toTrackResponsePublic(searchTrack);
  }

  async getLikedTracksV2(
    userId: string,
    requesterUserId: string | null,
  ): Promise<TrackResponsePublicDTO[] | null> {
    const [likedTracksList, user] = await Promise.all([
      this.tracksRepository.getLikedTracks(userId),
      requesterUserId
        ? this.tracksRepository.findUserById(requesterUserId)
        : null,
    ]);

    // no liked tracks for this user
    if (!likedTracksList) {
      return null;
    }
    logger.info(`[track]: fetched liked tracks for user ${userId}`);

    if (requesterUserId) {
      logger.info(`[track Priavte]: fetched liked tracks for user ${userId}`);
      // if private endpoint, fetch tracks that are not banned, user private and belong to him
      // if he is not the owner don't get the private tracks
      const visibleLikedTracks = likedTracksList.filter(
        (track) =>
          track &&
          track.hidden !== true &&
          (!track.basicInfo.isPrivate ||
            track.posterId.toString() === requesterUserId),
      );
      const repostedTracks =
        user?.reposts
          ?.filter((repost) => repost.type === 'track')
          .map((repost) => repost.id) ?? [];
      return TracksMapper.toTrackResponsePrivateListV2(
        visibleLikedTracks as ITrack[],
        requesterUserId,
        user?.country ?? '',
        repostedTracks,
      );
    }

    // if from public endpoint remove all private tracks
    logger.info(`[track Public]: fetched liked tracks for user ${userId}`);
    const visibleLikedTracks = likedTracksList.filter(
      (track) =>
        track &&
        !track.basicInfo.isPrivate &&
        track.hidden !== true &&
        track.geoBlocking.mode === 'worldwide',
    );

    return TracksMapper.toTrackResponsePublicList(
      visibleLikedTracks as ITrack[],
    );
  }

  async getTrackByPermalinkV2(
    permalink: string,
    profileLink: string,
    requesterUserId: string | null,
  ) {
    const [searchTrack, user] = await Promise.all([
      this.tracksRepository.getTrackByProfilePermalink(permalink, profileLink),
      requesterUserId
        ? this.tracksRepository.findUserById(requesterUserId)
        : null,
    ]);

    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }

    if (searchTrack.hidden) {
      throw ForbiddenError('Track is Banned Cannot Access It');
    }

    if (!requesterUserId && searchTrack.geoBlocking.mode !== 'worldwide') {
      throw ForbiddenError('Track Is Restricted By Region');
    }

    if (requesterUserId) {
      const repostedTracks =
        user?.reposts
          ?.filter((repost) => repost.type === 'track')
          .map((repost) => repost.id) ?? [];
      return TracksMapper.toTrackResponsePrivateV2(
        searchTrack,
        requesterUserId,
        user?.country ?? '',
        repostedTracks,
      );
    }
    return TracksMapper.toTrackResponsePublic(searchTrack);
  }

  async getPaginatedListV2(
    page: number,
    limit: number,
    requesterUserId: string | null,
  ): Promise<PaginationResponseDTO> {
    const [{ tracks, info }, user] = await Promise.all([
      this.tracksRepository.getPaginatedList(page, limit),
      requesterUserId
        ? this.tracksRepository.findUserById(requesterUserId)
        : null,
    ]);

    if (requesterUserId) {
      const visibleTracks = tracks.filter(
        (track) =>
          track?.hidden !== true &&
          (!track?.basicInfo.isPrivate ||
            track.posterId.toString() === requesterUserId),
      );
      const repostedTracks =
        user?.reposts
          ?.filter((repost) => repost.type === 'track')
          .map((repost) => repost.id) ?? [];

      return {
        tracks: TracksMapper.toTrackResponsePrivateListV2(
          visibleTracks as ITrack[],
          requesterUserId,
          user?.country ?? '',
          repostedTracks,
        ),
        paginationInfo: {
          ...info,
        },
      };
    }
    const visibleTracks = tracks.filter(
      (track) =>
        track &&
        !track.basicInfo.isPrivate &&
        track.hidden !== true &&
        track.geoBlocking.mode === 'worldwide',
    );

    return {
      tracks: TracksMapper.toTrackResponsePublicList(visibleTracks),
      paginationInfo: {
        ...info,
      },
    };
  }

  async getUserPostedTracksV2(userId: string, requesterUserId: string | null) {
    const [postedTracks, user] = await Promise.all([
      this.tracksRepository.getPostedTracks(userId),
      requesterUserId
        ? this.tracksRepository.findUserById(requesterUserId)
        : null,
    ]);

    console.log(postedTracks.map((track) => String(track._id)));

    if (requesterUserId) {
      const visibleTracks = postedTracks.filter(
        (track) =>
          track?.hidden !== true &&
          (!track?.basicInfo.isPrivate ||
            track.posterId.toString() === requesterUserId),
      );

      const repostedTracks =
        user?.reposts
          ?.filter((repost) => repost.type === 'track')
          .map((repost) => repost.id) ?? [];

      return TracksMapper.toTrackResponsePrivateListV2(
        visibleTracks,
        requesterUserId,
        user?.country ?? '',
        repostedTracks,
      );
    }
    const visibleTracks = postedTracks.filter(
      (track) =>
        track &&
        !track.basicInfo.isPrivate &&
        track.hidden !== true &&
        track.geoBlocking.mode === 'worldwide',
    );

    return TracksMapper.toTrackResponsePublicList(visibleTracks);
  }

  async getTrackDetailedInfoV2(
    userId: string,
    trackId: string,
    userRole: string,
  ) {
    const searchTrack = await this.tracksRepository.findById(trackId);

    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }

    this.validateTrackOwnerShip(
      userId,
      searchTrack.posterId.toString(),
      userRole,
    );

    const searchAdvancedInfo =
      await this.tracksRepository.getTrackAdvancedInfo(trackId);
    return TracksMapper.toTrackDetailedResponse(
      searchTrack,
      searchAdvancedInfo as IAdvancedAudioDetails,
    );
  }

  async incrementTrackNumPlaysV2(
    userId: string,
    trackId: string,
    listenedDuration: number,
    sessionIdPlay: string,
  ): Promise<void> {
    const searchTrack = await this.tracksRepository.findById(trackId);

    if (!searchTrack) {
      throw NotFoundError("Track Doesn't Exists");
    }

    if (listenedDuration < Math.floor(0.3 * searchTrack.durationInSeconds)) {
      throw BadRequestError(
        "Listened Duration Doesn't excedd 30% of Played Track",
      );
    }

    // check if in cool down period
    const isCooldown = await redisCacher.get(
      `play:cooldown:${userId}:${trackId}`,
    );
    if (isCooldown) {
      logger.info('[tracks]: still in cooldown - Returning sliently');
      return;
    }

    // check duplicate play
    const UniqueListenKey = await redisCacher.get(
      `play:dedup:${userId}:${trackId}:${sessionIdPlay}`,
    );
    if (UniqueListenKey) {
      logger.info('[tracks]: Duplicate Key - Returning sliently');
      return;
    }

    await Promise.all([
      redisCacher.set(
        `play:dedup:${userId}:${trackId}:${sessionIdPlay}`,
        1,
        60,
      ),
      redisCacher.set(
        `play:cooldown:${userId}:${trackId}`,
        '1',
        Math.floor(searchTrack.durationInSeconds * 0.3),
      ),
      this.tracksRepository.incrementNumPlays(trackId),
      this.tracksRepository.incrementInPlaysTable(trackId),
      this.tracksRepository.addToTrackStats(
        searchTrack,
        userId,
        listenedDuration,
      ),
    ]);

    return;
  }

  async getTrackStats(trackId: string) {
    const searchTrack = await this.tracksRepository.findById(trackId);

    if (!searchTrack) {
      throw NotFoundError("Track Doesn't Exists");
    }

    const [topFans, firstFans] = await Promise.all([
      this.tracksRepository.getTopFans(trackId),
      this.tracksRepository.getFirstFans(trackId),
    ]);
    return {
      topFans: topFans,
      firstFans: firstFans,
    };
  }
}
