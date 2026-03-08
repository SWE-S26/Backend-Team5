import { Router } from 'express';
import { messagingController } from './messaging.controller';

export const messagingRouter = Router();
//TODO: const messagingController = new MessagingController(/* TODO: inject service */);

// messagingRouter.get('/',      (req, res) => messagingController.findAll(req, res));
// messagingRouter.get('/:id',   (req, res) => messagingController.findOne(req, res));
// messagingRouter.post('/',     (req, res) => messagingController.create(req, res));
// messagingRouter.put('/:id',   (req, res) => messagingController.replace(req, res));
// messagingRouter.patch('/:id', (req, res) => messagingController.update(req, res));
// messagingRouter.delete('/:id',(req, res) => messagingController.remove(req, res));
