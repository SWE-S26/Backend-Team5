import z from 'zod';
import extendedZod from '../../../shared/docs/dtoDocumenter';

export const FeedItemDTO = extendedZod.object({
  id: extendedZod.mongoId(),
  type: extendedZod.enum(['track', 'playlist']),
  isRepost: extendedZod.boolean(),
  createdAt: extendedZod.string(),
  actorId: extendedZod.mongoId(),
  displayName: extendedZod.string(),
  imgLink: extendedZod.string().url().nullable(),
});

export const FeedResponseDTO = extendedZod.object({
  results: extendedZod.array(FeedItemDTO),
  hasMore: extendedZod.boolean(),
});

export type FeedResponseDTOType = z.infer<typeof FeedResponseDTO>;

export const SearchResultDTO = extendedZod.object({
  id: extendedZod.mongoId(),
  type: extendedZod.enum(['track', 'user', 'playlist', 'album']),
});

export const SearchCountsDTO = extendedZod.object({
  tracks: extendedZod.number(),
  users: extendedZod.number(),
  playlists: extendedZod.number(),
  albums: extendedZod.number(),
});

export const SearchResponseDTO = extendedZod.object({
  counts: SearchCountsDTO,
  results: extendedZod.array(SearchResultDTO),
  hasMore: extendedZod.boolean(),
});

export type SearchResponseDTOType = z.infer<typeof SearchResponseDTO>;

export const SearchSuggestionDTO = extendedZod.object({
  id: extendedZod.mongoId(),
  type: extendedZod.enum(['track', 'user', 'playlist', 'album']),
  title: extendedZod.string(),
  imgLink: extendedZod.string().url().nullable(),
  isPersonalized: extendedZod.boolean(),
});

export type SearchSuggestionDTOType = z.infer<typeof SearchSuggestionDTO>;

export const SearchHistoryItemDTO = extendedZod.object({
  id: extendedZod.mongoId(),
  type: extendedZod.enum(['track', 'user', 'playlist', 'album']),
  title: extendedZod.string(),
  imageUrl: extendedZod.string().url().nullable(),
  metadata: extendedZod.string().nullable(),
});

export type SearchHistoryItemDTOType = z.infer<typeof SearchHistoryItemDTO>;

export const TrendingTrackDTO = extendedZod.object({
  id: extendedZod.mongoId(),
});

export const TrendingResponseDTO = extendedZod.object({
  results: extendedZod.array(TrendingTrackDTO),
  hasMore: extendedZod.boolean(),
});

export type TrendingResponseDTOType = z.infer<typeof TrendingResponseDTO>;
