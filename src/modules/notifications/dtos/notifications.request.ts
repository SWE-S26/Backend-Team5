import extendedZod from '../../../shared/docs/dtoDocumenter';
import { NotificationIdParamDTO } from './notifications.request.params';
import { ListNotificationsQueryDTO } from './notifications.request.query';
import {
  RegisterFcmTokenBodyDTO,
  UnregisterFcmTokenBodyDTO,
} from './notifications.request.body';

export const GetNotificationsRequestDTO = extendedZod.object({
  query: ListNotificationsQueryDTO,
});

export const GetNotificationByIdRequestDTO = extendedZod.object({
  params: NotificationIdParamDTO,
});

export const RegisterFcmTokenRequestDTO = extendedZod.object({
  body: RegisterFcmTokenBodyDTO,
});

export const UnregisterFcmTokenRequestDTO = extendedZod.object({
  body: UnregisterFcmTokenBodyDTO,
});
