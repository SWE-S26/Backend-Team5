import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { FollowingService } from './following.service';
import { UserSummaryDTOType } from './dtos/following.response';
import { UserIdParamDTO } from './dtos/following.request.params';
import {
  GetFollowersRequestDTO,
  GetFollowingRequestDTO,
  GetBlockedRequestDTO,
  GetSuggestedRequestDTO,
} from './dtos/following.request';

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

  async block(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const validatedRequest = parseRequest(UserIdParamDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const blockedId = validatedRequest.data.params.id;

    const userSummary: UserSummaryDTOType = await this.service.block(
      userId,
      blockedId,
    );

    res.json(userSummary);
  }

  async unblock(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const validatedRequest = parseRequest(UserIdParamDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const blockedId = validatedRequest.data.params.id;

    const userSummary: UserSummaryDTOType = await this.service.unblock(
      userId,
      blockedId,
    );

    res.json(userSummary);
  }

  async getFollowers(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(GetFollowersRequestDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const userId = validatedRequest.data.params.id;
    const offset = validatedRequest.data.query?.offset ?? 0;
    const limit = validatedRequest.data.query?.limit ?? 20;

    const followers: UserSummaryDTOType[] = await this.service.getFollowers(
      userId,
      offset,
      limit,
    );

    res.json(followers);
  }

  async getFollowed(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(GetFollowingRequestDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const userId = validatedRequest.data.params.id;
    const offset = validatedRequest.data.query?.offset ?? 0;
    const limit = validatedRequest.data.query?.limit ?? 20;

    const followed: UserSummaryDTOType[] = await this.service.getFollowed(
      userId,
      offset,
      limit,
    );

    res.json(followed);
  }

  async getSuggestedUsers(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(GetSuggestedRequestDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const userId = req.userInfo!._id;
    const offset = validatedRequest.data.query?.offset ?? 0;
    const limit = validatedRequest.data.query?.limit ?? 20;

    const suggested: UserSummaryDTOType[] =
      await this.service.getSuggestedUsers(userId, offset, limit);

    res.json(suggested);
  }

  async getBlocked(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const validatedRequest = parseRequest(GetBlockedRequestDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const offset = validatedRequest.data.query?.offset ?? 0;
    const limit = validatedRequest.data.query?.limit ?? 20;

    const blocked: UserSummaryDTOType[] = await this.service.getBlocked(
      userId,
      offset,
      limit,
    );

    res.json(blocked);
  }
}
