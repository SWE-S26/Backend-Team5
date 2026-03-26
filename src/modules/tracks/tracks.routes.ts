import { Router } from 'express';
import { TracksController } from './tracks.controller';
import apiVersions from '../../shared/middleware/apiVersions';

const tracksRouter = Router();
const tracksController = new TracksController();

tracksRouter.delete(apiVersions.v1 + '/{:id}', (req, res) =>
  tracksController.deleteTrackById.bind(tracksController),
);

tracksRouter.get(apiVersions.v1 + '/{:id}', (req, res) =>
  tracksController.getTrackById.bind(tracksController),
);

tracksRouter.put(apiVersions.v1 + '/listen/{:id}', (req, res) =>
  tracksController.incrementTrackNumPlays.bind(tracksController),
);

tracksRouter.get(apiVersions.v1 + '/liked', (req, res) =>
  tracksController.incrementTrackNumPlays.bind(tracksController),
);

tracksRouter.get(apiVersions.v1 + '/permalink/{:permalink}', (req, res) =>
  tracksController.getTrackByPermalink.bind(tracksController),
);

// tracksRouter.get('/:id',   (req, res) => tracksController.findOne(req, res));
// tracksRouter.post('/',     (req, res) => tracksController.create(req, res));
// tracksRouter.put('/:id',   (req, res) => tracksController.replace(req, res));
// tracksRouter.patch('/:id', (req, res) => tracksController.update(req, res));
// tracksRouter.delete('/:id',(req, res) => tracksController.remove(req, res));

export default tracksRouter;
