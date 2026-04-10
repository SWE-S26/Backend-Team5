import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { PlaybackService } from './playback.service';
import { JWTPayload } from '../../shared/abstractions/jwt.service';

type userInfo = {
  userId: string;
  userRole: string;
  paymentInfo: unknown;
};

export class PlaybackController {
  private readonly service: PlaybackService;

  constructor() {
    this.service = new PlaybackService();
  }

  private getUserInfo(req: Request): userInfo {
    const { _id, role, paymentInfo } = req.userInfo! as JWTPayload;
    return {
      userId: _id,
      userRole: role,
      paymentInfo: paymentInfo,
    };
  }

  async getUserHistoryTracks(req: Request, res: Response): Promise<void> {
    const userInfo = this.getUserInfo(req);
    const userId = userInfo.userId;
    const userHistory = await this.service.getUserHistoryTracks(userId);

    res.status(200);
    res.json({
      message: 'User History Retrieved Successfully',
      data: userHistory,
    });
  }

  async findOne(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }
}
