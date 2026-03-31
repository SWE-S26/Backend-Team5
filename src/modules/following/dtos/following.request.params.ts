import { idParamDto } from '../../../shared/dtos/commonDTO';
import extendedZod from '../../../shared/docs/dtoDocumenter';
export const UserIdParamDTO = extendedZod.object({
  params: idParamDto,
});
