import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';

const router = Router();
const notificationsController = new NotificationsController(
  new NotificationsService(new NotificationsRepository()),
);

router.get('/', notificationsController.findAll.bind(notificationsController));
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
  notificationsController.findOne.bind(notificationsController),
);

// notificationsRouter.get('/',      (req, res) => notificationsController.findAll(req, res));
// notificationsRouter.get('/:id',   (req, res) => notificationsController.findOne(req, res));
// notificationsRouter.post('/',     (req, res) => notificationsController.create(req, res));
// notificationsRouter.put('/:id',   (req, res) => notificationsController.replace(req, res));
// notificationsRouter.patch('/:id', (req, res) => notificationsController.update(req, res));
// notificationsRouter.delete('/:id',(req, res) => notificationsController.remove(req, res));

export default router;
