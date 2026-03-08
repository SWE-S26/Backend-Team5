import { Router } from 'express';
import { feedController } from './feed.controller';

export const feedRouter = Router();
//TODO: const feedController = new FeedController(/* TODO: inject service */);

// feedRouter.get('/',      (req, res) => feedController.findAll(req, res));
// feedRouter.get('/:id',   (req, res) => feedController.findOne(req, res));
// feedRouter.post('/',     (req, res) => feedController.create(req, res));
// feedRouter.put('/:id',   (req, res) => feedController.replace(req, res));
// feedRouter.patch('/:id', (req, res) => feedController.update(req, res));
// feedRouter.delete('/:id',(req, res) => feedController.remove(req, res));
