import extendedZod from '../../../shared/docs/dtoDocumenter';
import { ProfileIdParamDTO } from './profile.request.params';
import {
  UpdateProfileRequestBodyDTO,
  UpdateAccountSettingsDTO,
  UpdateContentSettingsDTO,
  UpdatePrivacySettingsDTO,
  UpdateNotificationsSettingsDTO,
} from './profile.request.body';

export const CreateProfileRequestDTO = extendedZod.object({
  params: ProfileIdParamDTO,
});

export const UpdateProfileRequestDTO = extendedZod.object({
  body: UpdateProfileRequestBodyDTO,
});

export const UpdateAccountSettingsRequestDTO = extendedZod.object({
  body: UpdateAccountSettingsDTO,
});

export const UpdateContentSettingsRequestDTO = extendedZod.object({
  body: UpdateContentSettingsDTO,
});

export const UpdatePrivacySettingsRequestDTO = extendedZod.object({
  body: UpdatePrivacySettingsDTO,
});

export const UpdateNotificationsSettingsRequestDTO = extendedZod.object({
  body: UpdateNotificationsSettingsDTO,
});
