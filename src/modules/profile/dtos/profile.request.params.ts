import { idParamDto } from '../../../shared/dtos/commonDTO';
import extendedZod from '../../../shared/docs/dtoDocumenter';
export const ProfileIdParamDTO = extendedZod.object({
  params: idParamDto,
});

export const ProfileLinkParamDTO = extendedZod.object({
  params: extendedZod.object({
    profileLink: extendedZod.string().min(1),
  }),
});
