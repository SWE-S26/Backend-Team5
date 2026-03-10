import { Router } from 'express';
import { tracksController } from './tracks.controller';

const router = Router();
//TODO: const tracksController = new TracksController(/* TODO: inject service */);

// tracksRouter.get('/',      (req, res) => tracksController.findAll(req, res));
// tracksRouter.get('/:id',   (req, res) => tracksController.findOne(req, res));
// tracksRouter.post('/',     (req, res) => tracksController.create(req, res));
// tracksRouter.put('/:id',   (req, res) => tracksController.replace(req, res));
// tracksRouter.patch('/:id', (req, res) => tracksController.update(req, res));
// tracksRouter.delete('/:id',(req, res) => tracksController.remove(req, res));

export default router;
