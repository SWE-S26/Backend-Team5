import extendedZod from '../../../shared/docs/dtoDocumenter';
import { PaginationQueryDto } from '../../../shared/dtos/commonDTO';

// ! THIS IS AN EXAMPLE DTO
export const AuthRoleQueryDto = extendedZod.object({
  role: extendedZod.enum(['user', 'admin']).optional(),
});

// ! THIS IS AN EXAMPLE DTO
export const ListAuthsQueryDto = PaginationQueryDto.extend(
  AuthRoleQueryDto.shape,
).extend({
  // I have added the defualt because, I think every API would need it's default
  // for example you may fetch 8 comments easily, but not 8 posts, I am giving an example
  page: extendedZod.string().default('1'),
  limit: extendedZod.string().default('20'),
});

export const VerifyEmailQueryDto = extendedZod.object({
  token: extendedZod.string(),
});

export const GoogleCallbackQueryDto = extendedZod.object({
  code: extendedZod.string(),
});
