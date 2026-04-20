import extendedZod from '../../../shared/docs/dtoDocumenter';

export const findAllPlaylistsQueryDto = extendedZod.object({
  limit: extendedZod.coerce.number().int().min(1).max(20).default(10),
  offset: extendedZod.coerce.number().int().min(0).default(0),
});
