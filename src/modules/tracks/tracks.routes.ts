import { Router } from 'express';
import { TracksController } from './tracks.controller';
import apiVersions from '../../shared/middleware/apiVersions';

import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const tracksRouter = Router();
const tracksController = new TracksController();

tracksRouter.get(apiVersions.v1 + '/liked', (req, res) =>
  tracksController.getUserLikedTracks(req, res),
);

tracksRouter.delete(apiVersions.v1 + '/:id', (req, res) =>
  tracksController.deleteTrackById(req, res),
);

tracksRouter.get(apiVersions.v1 + '/:id', (req, res) =>
  tracksController.getTrackById(req, res),
);

tracksRouter.put(apiVersions.v1 + '/listen/:id', (req, res) =>
  tracksController.incrementTrackNumPlays(req, res),
);

tracksRouter.get(apiVersions.v1 + '/permalink/:permalink', (req, res) =>
  tracksController.getTrackByPermalink(req, res),
);

tracksRouter.patch(
  apiVersions.v1,
  upload.fields([{ name: 'image', maxCount: 1 }]),
  (req, res) => tracksController.updateTrackInfo(req, res),
);

tracksRouter.get(apiVersions.v1, (req, res) =>
  tracksController.getPaginatedListOfTracks(req, res),
);

tracksRouter.post(
  apiVersions.v1,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  (req, res) => tracksController.uploadAudioTrack(req, res),
);

export default tracksRouter;
