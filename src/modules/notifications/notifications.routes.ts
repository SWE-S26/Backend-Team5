import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';

const router = Router();
const notificationsController = new NotificationsController(
  new NotificationsService(new NotificationsRepository()),
);

router.get(
  '/',
  notificationsController.getNotifications.bind(notificationsController),
);

router.get(
  '/unread-count',
  notificationsController.getUnreadCount.bind(notificationsController),
);

router.patch(
  '/read-all',
  notificationsController.markAllAsRead.bind(notificationsController),
);

router.patch(
  '/:notificationId/read',
  notificationsController.markAsRead.bind(notificationsController),
);

router.get(
  '/:notificationId',
  notificationsController.getNotificationById.bind(notificationsController),
);

export default router;
