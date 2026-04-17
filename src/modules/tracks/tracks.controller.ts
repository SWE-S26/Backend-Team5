import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { TracksService } from './tracks.service';
import {
  DeleteTrackRequestDTO,
  GetTrackByIdRequestDTO,
  IncrementTrackListenCountRequestDTO,
  UploadAudioTrackRequestDTO,
  PermalinkRequestDTO,
  PaginationRequestDTO,
  UpdateTrackRequestDTO,
  GetLikedTracksByUserIdRequestDTO,
  GetPostedTracksByUserIdRequestDTO,
  AddTrackToUserHistoryRequestDTO,
  GetUserTrackDetailedInfoRequestDTO,
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
    if (req.body.basicInfo) req.body.basicInfo = JSON.parse(req.body.basicInfo);
    if (req.body.permissions)
      req.body.permissions = JSON.parse(req.body.permissions);
    if (req.body.license) req.body.license = JSON.parse(req.body.license);
    if (req.body.advanced) req.body.advanced = JSON.parse(req.body.advanced);
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

  async getTrackById(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(GetTrackByIdRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const trackId = validatedRequest.data.params.id;

    const trackInfo = await this.service.getTrackById(trackId);
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

    const userInfo = this.getUserInfo(req);
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

  async getUserLikedTracks(req: Request, res: Response): Promise<void> {
    // no validator required except auth middleware
    const validatedRequest = parseRequest(
      GetLikedTracksByUserIdRequestDTO,
      req,
    );

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userId = validatedRequest.data.params.id;
    const likedTracks = await this.service.getLikedTracks(userId);
    res.json({
      message: 'User Liked Tracks Received Successfully',
      data: likedTracks,
    });
  }

  async uploadAudioTrack(req: Request, res: Response): Promise<void> {
    // TODO : Check if user is Pro or no subscription to update criteria
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

  async getTrackByPermalink(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(PermalinkRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const permaLink = validatedRequest.data.params.permalink;

    const trackInfo = await this.service.getTrackByPermalink(permaLink);
    res.json({
      message: 'Track Info Retrieved Successfully',
      data: trackInfo,
    });
  }

  async getPaginatedListOfTracks(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(PaginationRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const page = validatedRequest.data.query.page;
    const limit = validatedRequest.data.query.limit;

    const paginationList = await this.service.getPaginatedList(page, limit);
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

  async getUserPostedTracks(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(
      GetPostedTracksByUserIdRequestDTO,
      req,
    );
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userId = validatedRequest.data.params.id;
    const postedTracks = await this.service.getUserPostedTracks(userId);

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
}
