import { Router } from 'express';
import { TracksController } from './tracks.controller';
import { TracksService } from './tracks.service';

const tracksRouter = Router();
const tracksController = new TracksController();

tracksRouter.delete('/{:id}', (req, res) =>
  tracksController.deleteTrackById(req, res),
);
// tracksRouter.get('/:id',   (req, res) => tracksController.findOne(req, res));
// tracksRouter.post('/',     (req, res) => tracksController.create(req, res));
// tracksRouter.put('/:id',   (req, res) => tracksController.replace(req, res));
// tracksRouter.patch('/:id', (req, res) => tracksController.update(req, res));
// tracksRouter.delete('/:id',(req, res) => tracksController.remove(req, res));

export default tracksRouter;
