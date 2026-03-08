import { Router } from 'express';
import { followingController } from './following.controller';

export const followingRouter = Router();
//TODO: const followingController = new FollowingController(/* TODO: inject service */);

// followingRouter.get('/',      (req, res) => followingController.findAll(req, res));
// followingRouter.get('/:id',   (req, res) => followingController.findOne(req, res));
// followingRouter.post('/',     (req, res) => followingController.create(req, res));
// followingRouter.put('/:id',   (req, res) => followingController.replace(req, res));
// followingRouter.patch('/:id', (req, res) => followingController.update(req, res));
// followingRouter.delete('/:id',(req, res) => followingController.remove(req, res));
