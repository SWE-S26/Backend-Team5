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
} from './dtos/tracks.request';

import { JWTPayload } from '../../shared/abstractions/jwt';
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

  private extractRequestFiles(req: Request) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const audio = files?.audio?.[0];
    const image = files?.image?.[0];

    // No Uploaded Track
    if (!audio) {
      throw BadRequestError('Audio File Required');
    }

    return { audio, image };
  }

  async deleteTrackById(req: Request, res: Response): Promise<void> {
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
      res.statusCode = 204;
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

    const userInfo = this.getUserInfo(req);
    const trackId = validatedRequest.data.params.id;

    const trackInfo = await this.service.getTrackById(trackId, userInfo.userId);
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
    const userInfo = this.getUserInfo(req);
    const likedTracks = this.service.getLikedTracks(userInfo.userId);
    res.json({
      message: 'User Liked Tracks Received Successfully',
      data: likedTracks,
    });
  }

  async uploadAudioTrack(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(UploadAudioTrackRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { audio, image } = this.extractRequestFiles(req);
    const trackInfo = validatedRequest.data.body;
    const isUploaded = await this.service.uploadAudioTrack(
      trackInfo,
      audio,
      image,
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

    // TODO : Make sure you are not fetching private trakcs
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
    const validatedRequest = parseRequest(UpdateTrackRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const userInfo = this.getUserInfo(req);
    const trackInfo = validatedRequest.data.body;
    const updatedTrack = await this.service.updateTrackInfo(
      trackInfo,
      userInfo.userId,
      userInfo.userRole,
    );

    res.status(200);
    res.json({
      message: 'Track Info Updated Successfully',
      data: updatedTrack,
    });
  }

  async replace(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }

  async update(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }

  async remove(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }
}
