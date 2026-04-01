import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { FollowingService } from './following.service';
import { UserSummaryDTOType } from './dtos/following.response';
import { UserIdParamDTO } from './dtos/following.request.params';

export class FollowingController {
  constructor(private readonly service: FollowingService) {}

  async addFollower(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const validatedRequest = parseRequest(UserIdParamDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const followedId = validatedRequest.data.params.id;

    const userSummary: UserSummaryDTOType = await this.service.addFollower(
      userId,
      followedId,
    );

    res.json(userSummary);
  }

  async removeFollower(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const validatedRequest = parseRequest(UserIdParamDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const followedId = validatedRequest.data.params.id;

    const userSummary: UserSummaryDTOType = await this.service.removeFollower(
      userId,
      followedId,
    );

    res.json(userSummary);
  }
}
