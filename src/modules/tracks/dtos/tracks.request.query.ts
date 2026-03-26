import extendedZod from '../../../shared/docs/dtoDocumenter';
import { PaginationQueryDto } from '../../../shared/dtos/commonDTO';

export const TracksRoleQueryDto = extendedZod.object({
  role: extendedZod.enum(['user', 'admin']).optional(),
});

export const ListTrackssQueryDto = PaginationQueryDto.extend(
  TracksRoleQueryDto.shape,
).extend({
  page: extendedZod.number().default(1),
  limit: extendedZod.number().default(20),
});
