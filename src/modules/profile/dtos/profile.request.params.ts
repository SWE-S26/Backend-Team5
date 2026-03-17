import { idParamDto } from '../../../shared/dtos/commonDTO';
import extendedZod from '../../../shared/docs/dtoDocumenter';
export const ProfileIdParamDTO = extendedZod.object({
  params: idParamDto,
});
