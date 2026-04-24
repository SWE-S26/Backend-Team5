import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { FeedService } from './feed.service';

import {
  GetFeedRequestDTO,
  GetTrendingTracksRequestDTO,
} from './dtos/feed.request';
import {
  FeedResponseDTOType,
  TrendingResponseDTOType,
} from './dtos/feed.response';

export class FeedController {
  constructor(private readonly service: FeedService) {}

  async getFeed(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;

    const validatedRequest = parseRequest(GetFeedRequestDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const offset = validatedRequest.data.query?.offset ?? 0;
    const limit = validatedRequest.data.query?.limit ?? 20;
    const includeReposts = validatedRequest.data.query?.includeReposts ?? true;

    const feed: FeedResponseDTOType = await this.service.getFeed(
      userId,
      includeReposts,
      offset,
      limit,
    );

    res.json(feed);
  }

  async getTrendingTracks(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(GetTrendingTracksRequestDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const offset = validatedRequest.data.query?.offset ?? 0;
    const limit = validatedRequest.data.query?.limit ?? 20;
    const userId = validatedRequest.data!.params.id;

    const trending: TrendingResponseDTOType =
      await this.service.getTrendingTracks(userId, offset, limit);

    res.json(trending);
  }
}
