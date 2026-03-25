import { idParamDto } from '../../../shared/dtos/commonDTO';
import extendedZod from '../../../shared/docs/dtoDocumenter';
export const ProfileIdParamDTO = extendedZod.object({
  params: idParamDto,
});

export const ProfileUserNameParamDTO = extendedZod.object({
  params: extendedZod.object({
    username: extendedZod.string().min(1),
  }),
});
