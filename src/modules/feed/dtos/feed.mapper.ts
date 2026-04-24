import {
  FeedResponseDTOType,
  SearchResponseDTOType,
  SearchSuggestionDTOType,
  SearchHistoryItemDTOType,
  TrendingResponseDTOType,
} from './feed.response';

export class FeedMapper {
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
}
