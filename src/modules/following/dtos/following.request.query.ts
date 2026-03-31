import extendedZod from '../../../shared/docs/dtoDocumenter';
import { PaginationQueryDto } from '../../../shared/dtos/commonDTO';

export const PaginationQueryDTO = extendedZod.object({
  offset: extendedZod.number().min(0).optional().default(0),
  limit: extendedZod.number().min(1).max(50).optional().default(20),
});
