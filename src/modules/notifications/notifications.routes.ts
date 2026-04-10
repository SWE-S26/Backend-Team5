import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import apiVersions from '../../shared/middleware/apiVersions';

const router = Router();
const notificationsController = new NotificationsController(
  new NotificationsService(new NotificationsRepository()),
);

router.get(
  apiVersions.v1 + '/',
  notificationsController.getNotifications.bind(notificationsController),
);

router.get(
  apiVersions.v1 + '/unread-count',
  notificationsController.getUnreadCount.bind(notificationsController),
);

router.patch(
  apiVersions.v1 + '/read-all',
  notificationsController.markAllAsRead.bind(notificationsController),
);

router.patch(
  apiVersions.v1 + '/:notificationId/read',
  notificationsController.markAsRead.bind(notificationsController),
);

router.get(
  apiVersions.v1 + '/:notificationId',
  notificationsController.getNotificationById.bind(notificationsController),
);

export default router;
