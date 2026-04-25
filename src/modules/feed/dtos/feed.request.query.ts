import z from 'zod';
import extendedZod from '../../../shared/docs/dtoDocumenter';

export const PaginationQueryDTO = extendedZod.object({
  offset: extendedZod.coerce.number().min(0).optional(),
  limit: extendedZod.coerce.number().min(1).max(50).optional(),
});

export const FeedQueryDTO = PaginationQueryDTO.extend({
  includeReposts: extendedZod.preprocess(
    (val) => val === 'true',
    extendedZod.boolean(),
  ),
});

export const SearchQueryDTO = PaginationQueryDTO.extend({
  q: extendedZod.string().min(1),
  type: extendedZod.enum([
    'everything',
    'tracks',
    'users',
    'playlists',
    'albums',
  ]),
  dateRange: extendedZod.enum(['hour', 'day', 'week', 'month', 'year', 'all']),
  duration: extendedZod.enum(['lt2', '2to10', '10to30', 'gt30', 'all']),
  usage: extendedZod.enum(['commercial', 'modify', 'share', 'listen']),
  tag: extendedZod.string().optional(),
  location: extendedZod.string().optional(),
});

export type SearchQueryDTOType = z.infer<typeof SearchQueryDTO>;

export const SuggestionsQueryDTO = extendedZod.object({
  q: extendedZod.string().min(1),
});
