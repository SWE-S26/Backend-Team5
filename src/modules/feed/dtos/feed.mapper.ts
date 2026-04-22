import {
  FeedResponseDTOType,
  SearchResponseDTOType,
  SearchSuggestionDTOType,
  SearchHistoryItemDTOType,
  TrendingResponseDTOType,
} from './feed.response';

export class FeedMapper {
  static toFeedItem(item: any) {
    return {
      id: item.id.toString(),
      type: item.type,
      isRepost: item.isRepost,
      createdAt: item.createdAt,
      actorId: item.actorId.toString(),
      displayName: item.displayName,
      profileImg: item.profileImg || null,
    };
  }

  static toFeedResponse(data: any[], hasMore: boolean): FeedResponseDTOType {
    return {
      results: data.map(this.toFeedItem),
      hasMore,
    };
  }

  static toSearchResponse(
    counts: any,
    results: any[],
    hasMore: boolean,
  ): SearchResponseDTOType {
    return {
      counts: {
        tracks: counts.tracks ?? 0,
        users: counts.users ?? 0,
        playlists: counts.playlists ?? 0,
        albums: counts.albums ?? 0,
      },
      results: results.map((r) => ({
        id: r._id.toString(),
        type: r.type,
      })),
      hasMore,
    };
  }

  // ===== Suggestions =====
  static toSuggestion(item: any): SearchSuggestionDTOType {
    return {
      id: item._id.toString(),
      type: item.type,
      title: item.title,
      imgLink: item.imgLink || null,
      isPersonalized: item.isPersonalized ?? false,
    };
  }

  static toHistoryItem(item: any): SearchHistoryItemDTOType {
    return {
      id: item.id.toString(),
      type: item.type.toLowerCase(),
      title: item.title,
      imageUrl: item.imageUrl || null,
      metadata: item.metadata || null,
    };
  }

  static toTrendingResponse(
    tracks: any[],
    hasMore: boolean,
  ): TrendingResponseDTOType {
    return {
      results: tracks.map((t) => ({
        id: t._id.toString(),
      })),
      hasMore,
    };
  }
}
