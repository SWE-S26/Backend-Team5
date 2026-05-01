import { idParamDto } from '../../../shared/dtos/commonDTO';
import extendedZod from '../../../shared/docs/dtoDocumenter';

export const TracksIdParamDTO = idParamDto.extend({});

export const UserIdParamDTO = idParamDto.extend({});

export const PermaLinkParamDTO = extendedZod.object({
  permalink: extendedZod
    .string()
    .regex(
      /^[a-z0-9_-]+$/,
      'Use only lowercase letters, numbers, underscores, or hyphens.',
    ),
});

export const ProfilePermalinkParamDTO = PermaLinkParamDTO.extend({
  profileLink: extendedZod
    .string()
    .regex(
      /^[a-z0-9_-]+$/,
      'Use only lowercase letters, numbers, underscores, or hyphens.',
    ),
});

export const UpdateMobileProPreviewParamDTO = extendedZod.object({
  id: extendedZod.string(),
});
