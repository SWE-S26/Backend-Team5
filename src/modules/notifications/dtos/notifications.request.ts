import extendedZod from '../../../shared/docs/dtoDocumenter';
import { NotificationsIdParamDTO } from './notifications.request.params';
import { ListNotificationssQueryDto } from './notifications.request.query';
import { CreateNotificationsRequestBodyDTO } from './notifications.request.body';

export const CreateNotificationsRequestDTO = extendedZod.object({
  params: NotificationsIdParamDTO,
  query: ListNotificationssQueryDto,
  body: CreateNotificationsRequestBodyDTO,
});
