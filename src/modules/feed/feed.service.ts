import { FeedRepository, feedItem, actor } from './feed.repository';

import { IUser } from '../../shared/models/models.user';

import {
  FeedResponseDTOType,
  TrendingResponseDTOType,
} from './dtos/feed.response';
import { SearchSuggestionDTOType } from './dtos/feed.response';

import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../../shared/errors/responseErrors';

export class FeedService {
  constructor(private readonly repository: FeedRepository) {}

  async getFeed(
    userId: string,
    includeReposts: boolean,
    offset: number,
    limit: number,
  ): Promise<FeedResponseDTOType> {
    const existingUser: IUser | null =
      await this.repository.getUserById(userId);
    if (!existingUser) throw NotFoundError('User not found');

    const followedIds: string[] = await this.repository.getUsersIds(userId);

    const limitHint = offset + limit;

    const postsFeed: feedItem[] = await this.repository.getPostsFeed(
      followedIds,
      limitHint,
    );

    let repostsFeed: feedItem[] = [];
    if (includeReposts) {
      repostsFeed = await this.repository.getRepostsFeed(
        followedIds,
        limitHint,
      );
    }

    const feed: feedItem[] = [...repostsFeed, ...postsFeed];

    feed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const paginatedFeed = feed.slice(offset, offset + limit);

    const actorIds = [...new Set(paginatedFeed.map((f) => f.actorId))];

    const actors: actor[] = await this.repository.getActorsInfo(actorIds);

    const actorsMap = new Map(actors.map((a) => [a.actorId, a]));

    const results = paginatedFeed.map((item) => ({
      id: item.id,
      type: item.type,
      isRepost: item.isRepost,
      createdAt: item.createdAt.toISOString(),
      actorId: item.actorId,
      displayName: actorsMap.get(item.actorId)?.displayName ?? 'UNKNOWN',
      imgLink: actorsMap.get(item.actorId)?.imgLink ?? null,
    }));

    return results;
  }

  async getTrendingTracks(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<TrendingResponseDTOType> {
    const existingUser: IUser | null =
      await this.repository.getUserById(userId);
    if (!existingUser) throw NotFoundError('User not found');

    const limitHint = offset + limit + 1;

    const trendingByGenresAndTags: string[] =
      await this.repository.getTrendingByGenresAndTags(userId, limitHint);
    const trendingByRecentPlays: string[] =
      await this.repository.getTrendingByRecentPlays(limitHint);
    const trendingByStats: string[] =
      await this.repository.getTrendingByStats(limitHint);

    const trendingTracks: string[] = Array.from(
      new Set([
        ...trendingByGenresAndTags,
        ...trendingByRecentPlays,
        ...trendingByStats,
      ]),
    );

    const paginatedTrendingTracks = trendingTracks.slice(
      offset,
      offset + limit,
    );

    return paginatedTrendingTracks.map((id) => ({ id }));
  }

  async getSearchSuggestions(
    userId: string,
    searchQuery: string,
  ): Promise<SearchSuggestionDTOType[]> {
    const existingUser: IUser | null =
      await this.repository.getUserById(userId);
    if (!existingUser) throw NotFoundError('User not found');

    const personalizedSearchSuggestions: SearchSuggestionDTOType[] =
      await this.repository.getPersonalizedSearchSuggestions(
        userId,
        searchQuery,
      );

    let limit = 9;
    if (personalizedSearchSuggestions.length === 2) limit = 8;

    const globalSearchSuggestions: SearchSuggestionDTOType[] =
      await this.repository.getGlobalSearchSuggestions(searchQuery, limit);

    return [...personalizedSearchSuggestions, ...globalSearchSuggestions];
  }
}
