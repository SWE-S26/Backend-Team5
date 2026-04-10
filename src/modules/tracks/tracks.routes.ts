import { Router } from 'express';
import { TracksController } from './tracks.controller';
import apiVersions from '../../shared/middleware/apiVersions';

import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const tracksPrivateRouter = Router();
const tracksPublicRouter = Router();
const tracksController = new TracksController();

// ========================= PUBLIC =========================

tracksPublicRouter.get(apiVersions.v1 + '/liked/:id', (req, res) =>
  tracksController.getUserLikedTracks(req, res),
);

tracksPublicRouter.get(apiVersions.v1 + '/:id', (req, res) =>
  tracksController.getTrackById(req, res),
);

tracksPublicRouter.get(apiVersions.v1 + '/permalink/:permalink', (req, res) =>
  tracksController.getTrackByPermalink(req, res),
);

tracksPublicRouter.get(apiVersions.v1, (req, res) =>
  tracksController.getPaginatedListOfTracks(req, res),
);

tracksPublicRouter.get(apiVersions.v1 + '/posted/:id', (req, res) =>
  tracksController.getUserPostedTracks(req, res),
);

// ======================== PRIVATE =========================

// ================= GET ===================

// ================= DELETE ===================

tracksPrivateRouter.delete(apiVersions.v1 + '/:id', (req, res) =>
  tracksController.deleteTrackById(req, res),
);

// ================= PATCH ===================

tracksPrivateRouter.patch(apiVersions.v1 + '/listen/:id', (req, res) =>
  tracksController.incrementTrackNumPlays(req, res),
);

tracksPrivateRouter.patch(
  apiVersions.v1,
  upload.fields([{ name: 'image', maxCount: 1 }]),
  (req, res) => tracksController.updateTrackInfo(req, res),
);

// ================= POST ===================

tracksPrivateRouter.post(
  apiVersions.v1,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  (req, res) => tracksController.uploadAudioTrack(req, res),
);

export { tracksPublicRouter };
export default tracksPrivateRouter;
