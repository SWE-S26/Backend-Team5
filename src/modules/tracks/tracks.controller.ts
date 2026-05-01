import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { TracksService } from './tracks.service';
import {
  DeleteTrackRequestDTO,
  GetTrackByIdRequestDTO,
  IncrementTrackListenCountRequestDTO,
  IncrementTrackListenCountRequestDTOV2,
  UploadAudioTrackRequestDTO,
  GetTrackByProfilePermalinkRequestDTO,
  PaginationRequestDTO,
  UpdateTrackRequestDTO,
  GetLikedTracksByUserIdRequestDTO,
  GetPostedTracksByUserIdRequestDTO,
  AddTrackToUserHistoryRequestDTO,
  GetUserTrackDetailedInfoRequestDTO,
  IsValidPermaLinkForUser,
  UploadAudioTrackRequestDTOV2,
  UpdateTrackRequestDTOV2,
  TrackStatsRequestDTO,
  DownloadTrackIncrementRequestDTO,
} from './dtos/tracks.request';
import logger from '../../shared/logger/logger';

import { JWTPayload } from '../../shared/abstractions/jwt.service';
import { BadRequestError } from '../../shared/errors/responseErrors';

type userInfo = {
  userId: string;
  userRole: string;
  paymentInfo: unknown;
};

export class TracksController {
  private readonly service: TracksService;

  constructor() {
    this.service = new TracksService();
  }

  private getUserInfo(req: Request): userInfo {
    const { _id, role, paymentInfo } = req.userInfo! as JWTPayload;
    return {
      userId: _id,
      userRole: role,
      paymentInfo: paymentInfo,
    };
  }

  private extractAudioFile(req: Request) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const audio = files?.audio?.[0];

    if (!audio) {
      throw BadRequestError('Audio File Required');
    }

    return audio;
  }

  private extractImageFile(req: Request) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    return files?.image?.[0];
  }

  private parseFormDataToJson(req: Request) {
    const fields = ['basicInfo', 'permissions', 'license', 'advanced'];
    for (const field of fields) {
      if (req.body[field]) {
        req.body[field] = JSON.parse(req.body[field]);
      }
    }
  }

  async deleteTrackById(req: Request, res: Response): Promise<void> {
    logger.info('I AM HERE HELP US GOD');
    const validatedRequest = parseRequest(DeleteTrackRequestDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userInfo = this.getUserInfo(req);
    const trackId = validatedRequest.data.params.id;
    const isDeleted = await this.service.deleteTrackById(
      userInfo.userId,
      trackId,
      userInfo.userRole,
    );
    if (isDeleted) {
      res.statusCode = 200;
      res.json({
        message: 'Track Deleted Sucessfully',
      });
    } else {
      res.statusCode = 500;
      res.json({
        message: 'Internal Server Error',
      });
    }
  }

  async getTrackById(
    req: Request,
    res: Response,
    type: 'PUBLIC' | 'PRIVATE',
  ): Promise<void> {
    const validatedRequest = parseRequest(GetTrackByIdRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    let requesterUserId = null;
    if (type == 'PRIVATE') {
      requesterUserId = this.getUserInfo(req).userId;
    }

    const trackId = validatedRequest.data.params.id;

    const trackInfo = await this.service.getTrackById(trackId, requesterUserId);
    res.json({
      message: 'Track Info Retrieved Successfully',
      data: trackInfo,
    });
  }

  async incrementTrackNumPlays(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(
      IncrementTrackListenCountRequestDTO,
      req,
    );

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const trackId = validatedRequest.data.params.id;
    const isUpdatedNumPlays =
      await this.service.incrementTrackNumPlays(trackId);
    if (isUpdatedNumPlays) {
      res.json({
        message: 'Number of Plays Updated Successfully',
      });
    } else {
      res.json({
        message: 'Error Occured While Updating Number of Plays',
      });
    }
  }

  async getUserLikedTracks(
    req: Request,
    res: Response,
    type: 'PUBLIC' | 'PRIVATE',
  ): Promise<void> {
    // no validator required except auth middleware
    const validatedRequest = parseRequest(
      GetLikedTracksByUserIdRequestDTO,
      req,
    );

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    let requesterUserId = null;
    if (type == 'PRIVATE') {
      requesterUserId = this.getUserInfo(req).userId;
    }

    const userId = validatedRequest.data.params.id;
    const likedTracks = await this.service.getLikedTracks(
      userId,
      requesterUserId,
    );
    res.json({
      message: 'User Liked Tracks Received Successfully',
      data: likedTracks,
    });
  }

  async uploadAudioTrack(req: Request, res: Response): Promise<void> {
    this.parseFormDataToJson(req);

    const validatedRequest = parseRequest(UploadAudioTrackRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const audio = this.extractAudioFile(req);
    const image = this.extractImageFile(req);
    const userInfo = this.getUserInfo(req);
    const trackInfo = validatedRequest.data.body;
    const isUploaded = await this.service.uploadAudioTrack(
      trackInfo,
      audio,
      image,
      userInfo.userId,
    );

    if (isUploaded) {
      res.statusCode = 201;
      res.json({
        message: 'Track Uploaded Successfully',
      });
    } else {
      throw new Error('Internal Server Error');
    }
  }

  async getTrackByPermalink(
    req: Request,
    res: Response,
    type: 'PUBLIC' | 'PRIVATE',
  ): Promise<void> {
    const validatedRequest = parseRequest(
      GetTrackByProfilePermalinkRequestDTO,
      req,
    );

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    let requesterUserId = null;
    if (type == 'PRIVATE') {
      requesterUserId = this.getUserInfo(req).userId;
    }

    const permaLink = validatedRequest.data.params.permalink;
    const profileLink = validatedRequest.data.params.profileLink;

    const trackInfo = await this.service.getTrackByPermalink(
      permaLink,
      profileLink,
      requesterUserId,
    );
    res.json({
      message: 'Track Info Retrieved Successfully',
      data: trackInfo,
    });
  }

  async getPaginatedListOfTracks(
    req: Request,
    res: Response,
    type: 'PUBLIC' | 'PRIVATE',
  ): Promise<void> {
    const validatedRequest = parseRequest(PaginationRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const page = validatedRequest.data.query.page;
    const limit = validatedRequest.data.query.limit;
    let requesterUserId = null;
    if (type == 'PRIVATE') {
      requesterUserId = this.getUserInfo(req).userId;
    }

    const paginationList = await this.service.getPaginatedList(
      page,
      limit,
      requesterUserId,
    );
    if (paginationList) {
      res.status(200);
      res.json({
        message: 'Tracks Retrieved Successfully',
        data: paginationList,
      });
    } else {
      throw new Error('Internal Server Error');
    }
  }

  async updateTrackInfo(req: Request, res: Response): Promise<void> {
    this.parseFormDataToJson(req);

    const validatedRequest = parseRequest(UpdateTrackRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const image = this.extractImageFile(req);
    const userInfo = this.getUserInfo(req);
    const trackInfo = validatedRequest.data.body;
    const updatedTrack = await this.service.updateTrackInfo(
      trackInfo,
      userInfo.userId,
      userInfo.userRole,
      image,
    );

    res.status(200);
    res.json({
      message: 'Track Info Updated Successfully',
      data: updatedTrack,
    });
  }

  async getUserPostedTracks(
    req: Request,
    res: Response,
    type: 'PUBLIC' | 'PRIVATE',
  ): Promise<void> {
    const validatedRequest = parseRequest(
      GetPostedTracksByUserIdRequestDTO,
      req,
    );
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userId = validatedRequest.data.params.id;
    let requesterUserId = null;
    if (type == 'PRIVATE') {
      requesterUserId = this.getUserInfo(req).userId;
    }
    const postedTracks = await this.service.getUserPostedTracks(
      userId,
      requesterUserId,
    );

    res.status(200);
    res.json({
      message: 'User Posted Tracks Retrieved Successfully',
      data: postedTracks,
    });
  }

  async addTrackToUserHistory(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(AddTrackToUserHistoryRequestDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userInfo = this.getUserInfo(req);
    const userId = userInfo.userId;
    const trackId = validatedRequest.data.params.id;
    const result = await this.service.addToUserHistory(userId, trackId);
    if (result) {
      res.status(200);
      res.json({
        message: 'Added To User History',
      });
    } else {
      res.status(500);
      res.json({
        message: 'Internal Server Error',
      });
    }
  }

  async getDetailedTrackInfo(req: Request, res: Response) {
    const validatedRequest = parseRequest(
      GetUserTrackDetailedInfoRequestDTO,
      req,
    );
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userInfo = this.getUserInfo(req);
    const userId = userInfo.userId;
    const userRole = userInfo.userRole;
    const trackId = validatedRequest.data.params.id;
    const trackDetailedInfo = await this.service.getTrackDetailedInfo(
      userId,
      trackId,
      userRole,
    );

    res.status(200);
    res.json({
      message: 'Detailed Track Info Successfully',
      data: trackDetailedInfo,
    });
  }

  async isValidPermalink(req: Request, res: Response) {
    const validatedRequest = parseRequest(IsValidPermaLinkForUser, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const permalink = validatedRequest.data.params.permalink;
    const userInfo = this.getUserInfo(req);
    const userId = userInfo.userId;

    const isFound = await this.service.isPermalinkFoundForUser(
      permalink,
      userId,
    );
    res.status(200);
    res.json({
      message: 'Requested Done Successfully',
      data: {
        isFound,
      },
    });
  }

  async getUserQuota(req: Request, res: Response) {
    const userInfo = this.getUserInfo(req);
    const userId = userInfo.userId;
    logger.info('Q');
    const quota = await this.service.getUserQuota(userId);
    res.status(200);
    res.json({
      message: 'User Quota Fetched Successfully',
      data: {
        quota,
      },
    });
  }

  async getPlaylistsContainingTrack(
    req: Request,
    res: Response,
    type: 'PUBLIC' | 'PRIVATE',
    playlistType: 'playlist' | 'album',
  ) {
    const validatedRequest = parseRequest(GetTrackByIdRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    let requesterUserId = null;
    if (type == 'PRIVATE') {
      requesterUserId = this.getUserInfo(req).userId;
    }

    const trackId = validatedRequest.data.params.id;

    const trackInfo = await this.service.getPlaylistsContainingTrack(
      trackId,
      requesterUserId,
      playlistType,
    );
    res.json({
      message: 'Track Playlists Retrieved Successfully',
      data: trackInfo,
    });
  }

  // ============================================== V2 ========================================

  async uploadAudioTrackV2(req: Request, res: Response): Promise<void> {
    this.parseFormDataToJson(req);

    const validatedRequest = parseRequest(UploadAudioTrackRequestDTOV2, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const audio = this.extractAudioFile(req);
    const image = this.extractImageFile(req);
    const userInfo = this.getUserInfo(req);
    const trackInfo = validatedRequest.data.body;
    const isUploaded = await this.service.uploadAudioTrackV2(
      trackInfo,
      audio,
      image,
      userInfo.userId,
    );

    if (isUploaded) {
      res.statusCode = 201;
      res.json({
        message: 'Track Uploaded Successfully',
      });
    } else {
      throw new Error('Internal Server Error');
    }
  }

  async updateTrackInfoV2(req: Request, res: Response): Promise<void> {
    this.parseFormDataToJson(req);

    const validatedRequest = parseRequest(UpdateTrackRequestDTOV2, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const image = this.extractImageFile(req);
    const userInfo = this.getUserInfo(req);
    const trackInfo = validatedRequest.data.body;
    await this.service.updateTrackInfoV2(
      trackInfo,
      userInfo.userId,
      userInfo.userRole,
      image,
    );

    res.status(200);
    res.json({
      message: 'Track Info Updated Successfully',
    });
  }

  async getTrackByIdV2(
    req: Request,
    res: Response,
    type: 'PUBLIC' | 'PRIVATE',
  ): Promise<void> {
    const validatedRequest = parseRequest(GetTrackByIdRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    let requesterUserId = null;
    if (type == 'PRIVATE') {
      requesterUserId = this.getUserInfo(req).userId;
    }

    const trackId = validatedRequest.data.params.id;

    const trackInfo = await this.service.getTrackByIdV2(
      trackId,
      requesterUserId,
    );
    res.json({
      message: 'Track Info Retrieved Successfully',
      data: trackInfo,
    });
  }

  async getUserLikedTracksV2(
    req: Request,
    res: Response,
    type: 'PUBLIC' | 'PRIVATE',
  ): Promise<void> {
    // no validator required except auth middleware
    const validatedRequest = parseRequest(
      GetLikedTracksByUserIdRequestDTO,
      req,
    );

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    let requesterUserId = null;
    if (type == 'PRIVATE') {
      requesterUserId = this.getUserInfo(req).userId;
    }

    const userId = validatedRequest.data.params.id;
    const likedTracks = await this.service.getLikedTracksV2(
      userId,
      requesterUserId,
    );
    res.json({
      message: 'User Liked Tracks Received Successfully',
      data: likedTracks,
    });
  }

  async getTrackByPermalinkV2(
    req: Request,
    res: Response,
    type: 'PUBLIC' | 'PRIVATE',
  ): Promise<void> {
    const validatedRequest = parseRequest(
      GetTrackByProfilePermalinkRequestDTO,
      req,
    );

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    let requesterUserId = null;
    if (type == 'PRIVATE') {
      requesterUserId = this.getUserInfo(req).userId;
    }

    const permaLink = validatedRequest.data.params.permalink;
    const profileLink = validatedRequest.data.params.profileLink;

    const trackInfo = await this.service.getTrackByPermalinkV2(
      permaLink,
      profileLink,
      requesterUserId,
    );
    res.json({
      message: 'Track Info Retrieved Successfully',
      data: trackInfo,
    });
  }

  async getPaginatedListOfTracksV2(
    req: Request,
    res: Response,
    type: 'PUBLIC' | 'PRIVATE',
  ): Promise<void> {
    const validatedRequest = parseRequest(PaginationRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const page = validatedRequest.data.query.page;
    const limit = validatedRequest.data.query.limit;
    let requesterUserId = null;
    if (type == 'PRIVATE') {
      requesterUserId = this.getUserInfo(req).userId;
    }

    const paginationList = await this.service.getPaginatedListV2(
      page,
      limit,
      requesterUserId,
    );
    if (paginationList) {
      res.status(200);
      res.json({
        message: 'Tracks Retrieved Successfully',
        data: paginationList,
      });
    } else {
      throw new Error('Internal Server Error');
    }
  }

  async getUserPostedTracksV2(
    req: Request,
    res: Response,
    type: 'PUBLIC' | 'PRIVATE',
  ): Promise<void> {
    const validatedRequest = parseRequest(
      GetPostedTracksByUserIdRequestDTO,
      req,
    );
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userId = validatedRequest.data.params.id;
    let requesterUserId = null;
    if (type == 'PRIVATE') {
      requesterUserId = this.getUserInfo(req).userId;
    }
    const postedTracks = await this.service.getUserPostedTracksV2(
      userId,
      requesterUserId,
    );

    res.status(200);
    res.json({
      message: 'User Posted Tracks Retrieved Successfully',
      data: postedTracks,
    });
  }

  async getDetailedTrackInfoV2(req: Request, res: Response) {
    const validatedRequest = parseRequest(
      GetUserTrackDetailedInfoRequestDTO,
      req,
    );
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userInfo = this.getUserInfo(req);
    const userId = userInfo.userId;
    const userRole = userInfo.userRole;
    const trackId = validatedRequest.data.params.id;
    const trackDetailedInfo = await this.service.getTrackDetailedInfoV2(
      userId,
      trackId,
      userRole,
    );

    res.status(200);
    res.json({
      message: 'Detailed Track Info Successfully',
      data: trackDetailedInfo,
    });
  }

  async incrementTrackNumPlaysV2(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(
      IncrementTrackListenCountRequestDTOV2,
      req,
    );

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userId = this.getUserInfo(req).userId;
    const trackId = validatedRequest.data.body.trackId;
    const listenedDuration = validatedRequest.data.body.listenedDuration;
    const sessionIdPlay = validatedRequest.data.body.sessionIdPlay;
    await this.service.incrementTrackNumPlaysV2(
      userId,
      trackId,
      listenedDuration,
      sessionIdPlay,
    );
    res.json({
      message: 'Number of Plays Updated Successfully',
    });
  }

  async getTrackStats(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(TrackStatsRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const trackId = validatedRequest.data.params.id;
    const trackStats = await this.service.getTrackStats(trackId);
    res.json({
      message: 'Track Stats Retrieved Sucessfully',
      data: trackStats,
    });
  }

  async incrementDownloads(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(
      DownloadTrackIncrementRequestDTO,
      req,
    );

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const trackId = validatedRequest.data.body.trackId;
    const sessionIdDownload = validatedRequest.data.body.sessionIdDownload;
    await this.service.incrementDownloads(trackId, sessionIdDownload);
    res.json({
      message: 'Track Number Of Downloads Incremented ',
    });
  }
}
