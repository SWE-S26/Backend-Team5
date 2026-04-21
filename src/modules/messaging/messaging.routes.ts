import { Router } from 'express';
import { MessagingController } from './messaging.controller';
import apiVersions from '../../shared/middleware/apiVersions';

const messagingRouter = Router();
const messagingController = new MessagingController();

messagingRouter.post(apiVersions.v1 + '/send', (req, res) =>
  messagingController.sendNewMessage(req, res),
);

messagingRouter.patch(apiVersions.v1 + '/archive', (req, res) =>
  messagingController.archiveChat(req, res),
);

messagingRouter.get(apiVersions.v1 + '/chats', (req, res) =>
  messagingController.getChatsHistory(req, res),
);

messagingRouter.get(apiVersions.v1 + '/chat/message/:id', (req, res) =>
  messagingController.getChatMessages(req, res),
);

messagingRouter.patch(apiVersions.v1 + '/chat/read/', (req, res) =>
  messagingController.markAsRead(req, res),
);

messagingRouter.patch(apiVersions.v1 + '/chat/unread/', (req, res) =>
  messagingController.markAsUnRead(req, res),
);

// messagingRouter.get('/:id',   (req, res) => messagingController.findOne(req, res));
// messagingRouter.post('/',     (req, res) => messagingController.create(req, res));
// messagingRouter.put('/:id',   (req, res) => messagingController.replace(req, res));
// messagingRouter.patch('/:id', (req, res) => messagingController.update(req, res));
// messagingRouter.delete('/:id',(req, res) => messagingController.remove(req, res));

export default messagingRouter;
