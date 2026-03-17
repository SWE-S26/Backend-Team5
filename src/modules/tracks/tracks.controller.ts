import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { TracksService } from './tracks.service';
import { DeleteTrackRequestDTO } from './dtos/tracks.request';

import { JWTPayload } from '../../shared/abstractions/jwt';

export class TracksController {
  private readonly service: TracksService;
  constructor() {
    2;
    this.service = new TracksService();
  }

  async deleteTrackById(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(DeleteTrackRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { _id, role, paymentInfo } = req.userInfo! as JWTPayload;
    const userId = _id;
    const userRole = role;
    const trackId = validatedRequest.data.params.id;
    const isDeleted = await this.service.deleteTrackById(
      userId,
      trackId,
      userRole,
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

  async findOne(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
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
