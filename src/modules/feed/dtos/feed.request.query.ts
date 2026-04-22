import extendedZod from '../../../shared/docs/dtoDocumenter';

export const PaginationQueryDTO = extendedZod.object({
  offset: extendedZod.number().min(0).optional(),
  limit: extendedZod.number().min(1).max(50).optional(),
});

export const FeedQueryDTO = PaginationQueryDTO.extend({
  includeReposts: extendedZod.boolean().optional(),
});

export const SearchQueryDTO = PaginationQueryDTO.extend({
  q: extendedZod.string().min(1),
  type: extendedZod
    .enum(['everything', 'tracks', 'users', 'playlists', 'albums'])
    .optional(),
  dateRange: extendedZod
    .enum(['hour', 'day', 'week', 'month', 'year', 'all'])
    .optional(),
  duration: extendedZod
    .enum(['lt2', '2to10', '10to30', 'gt30', 'all'])
    .optional(),
  usage: extendedZod
    .enum(['commercial', 'modify', 'share', 'listen'])
    .optional(),
  tag: extendedZod.string().optional(),
  location: extendedZod.string().optional(),
});

export const SuggestionsQueryDTO = extendedZod.object({
  q: extendedZod.string().min(1),
});
