import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { FeedService } from './feed.service';

import {
  GetFeedRequestDTO,
  GetTrendingTracksRequestDTO,
  SuggestionsRequestDTO,
  SearchRequestDTO,
} from './dtos/feed.request';

import {
  FeedResponseDTOType,
  TrendingResponseDTOType,
  SearchSuggestionDTOType,
  SearchResponseDTOType,
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

  async getSearchSuggestions(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(SuggestionsRequestDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const searchQuery = validatedRequest.data.query.q;
    const userId = req.userInfo!._id;

    const searchSuggestions: SearchSuggestionDTOType[] =
      await this.service.getSearchSuggestions(userId, searchQuery);

    res.json(searchSuggestions);
  }

  async applyGlobalSearch(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(SearchRequestDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const searchParams = validatedRequest.data.query;

    const searchResult: SearchResponseDTOType =
      await this.service.applyGlobalSearch(searchParams);

    res.json(searchResult);
  }
}
