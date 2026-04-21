import extendedZod from '../../../shared/docs/dtoDocumenter';
import { idParamDto } from '../../../shared/dtos/commonDTO';
export const AdminIdParamDTO = idParamDto.extend({});

export const UserIdParamDTO = extendedZod.object({
  userId: extendedZod.mongoId(),
});
