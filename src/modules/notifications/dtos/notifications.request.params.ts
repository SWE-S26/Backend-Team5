import extendedZod from '../../../shared/docs/dtoDocumenter';

export const NotificationIdParamDTO = extendedZod.object({
  notificationId: extendedZod.mongoId(),
});
