import extendedZod from '../../../shared/docs/dtoDocumenter';
import { PaginationQueryDto } from '../../../shared/dtos/commonDto';

export const EngagementRoleQueryDto = extendedZod.object({
  role: extendedZod.enum(['user', 'admin']).optional(),
});

export const ListEngagementsQueryDto = PaginationQueryDto.extend(
  EngagementRoleQueryDto.shape,
).extend({
  // I have added the defualt because, I think every API would need it's default
  // for example you may fetch 8 comments easily, but not 8 posts, I am giving an example
  page: extendedZod.string().default('1'),
  limit: extendedZod.string().default('20'),
});
