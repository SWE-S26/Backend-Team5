import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { FeedService } from './feed.service';

import { GetFeedRequestDTO } from './dtos/feed.request';
import { FeedResponseDTOType } from './dtos/feed.response';

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
}
