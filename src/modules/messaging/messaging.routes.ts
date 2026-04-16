import { Router } from 'express';
import { MessagingController } from './messaging.controller';

const messagingRouter = Router();
const messagingController = new MessagingController();

messagingRouter.post('/', (req, res) =>
  messagingController.sendNewMessage(req, res),
);

// messagingRouter.get('/:id',   (req, res) => messagingController.findOne(req, res));
// messagingRouter.post('/',     (req, res) => messagingController.create(req, res));
// messagingRouter.put('/:id',   (req, res) => messagingController.replace(req, res));
// messagingRouter.patch('/:id', (req, res) => messagingController.update(req, res));
// messagingRouter.delete('/:id',(req, res) => messagingController.remove(req, res));

export default messagingRouter;
