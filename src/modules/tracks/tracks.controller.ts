import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { TracksService } from './tracks.service';
import {
  DeleteTrackRequestDTO,
  GetTrackByIdRequestDTO,
} from './dtos/tracks.request';

import { JWTPayload } from '../../shared/abstractions/jwt';
import { success } from 'zod';

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
        success: true,
        message: 'Track Deleted Sucessfully',
      });
    } else {
      res.statusCode = 500;
      res.json({
        success: false,
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

    const trackInfo = this.service.getTrackById(trackId, userInfo.userId);
    res.json({
      success: true,
      message: 'Track Info Retrieved Successfully',
      data: trackInfo,
    });
  }

  async create(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
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
