import extendedZod from '../../../shared/docs/dtoDocumenter';
import { NotificationIdParamDTO } from './notifications.request.params';
import { ListNotificationsQueryDTO } from './notifications.request.query';

export const GetNotificationsRequestDTO = extendedZod.object({
  query: ListNotificationsQueryDTO,
});

export const GetNotificationByIdRequestDTO = extendedZod.object({
  params: NotificationIdParamDTO,
});
