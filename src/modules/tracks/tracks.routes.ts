import { Router } from 'express';
import { TracksController } from './tracks.controller';
import apiVersions from '../../shared/middleware/apiVersions';
import rateLimit from 'express-rate-limit';
import multer from 'multer';

const uploadTrackLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 8,
  keyGenerator: (req) => String(req.userInfo!._id),
  message: 'You can only upload one track every 24 hours.',
});

const upload = multer({ storage: multer.memoryStorage() });

const tracksPrivateRouter = Router();
const tracksPublicRouter = Router();
const tracksController = new TracksController();

// ========================= PUBLIC =========================

tracksPublicRouter.get(apiVersions.v1 + '/liked/:id', (req, res) =>
  tracksController.getUserLikedTracks(req, res, 'PUBLIC'),
);

tracksPublicRouter.get(apiVersions.v1 + '/:id', (req, res) =>
  tracksController.getTrackById(req, res, 'PUBLIC'),
);

tracksPublicRouter.get(
  apiVersions.v1 + '/permalink/:profileLink/:permalink',
  (req, res) => tracksController.getTrackByPermalink(req, res, 'PUBLIC'),
);

tracksPublicRouter.get(apiVersions.v1, (req, res) =>
  tracksController.getPaginatedListOfTracks(req, res, 'PUBLIC'),
);

tracksPublicRouter.get(apiVersions.v1 + '/posted/:id', (req, res) =>
  tracksController.getUserPostedTracks(req, res, 'PUBLIC'),
);

// ======================== PRIVATE =========================

tracksPrivateRouter.get(apiVersions.v1 + '/liked/:id', (req, res) =>
  tracksController.getUserLikedTracks(req, res, 'PRIVATE'),
);

tracksPrivateRouter.get(apiVersions.v1 + '/:id', (req, res) =>
  tracksController.getTrackById(req, res, 'PRIVATE'),
);

tracksPrivateRouter.get(apiVersions.v1 + '/permalink/:permalink', (req, res) =>
  tracksController.getTrackByPermalink(req, res, 'PRIVATE'),
);

tracksPrivateRouter.get(apiVersions.v1, (req, res) =>
  tracksController.getPaginatedListOfTracks(req, res, 'PRIVATE'),
);

tracksPrivateRouter.get(apiVersions.v1 + '/posted/:id', (req, res) =>
  tracksController.getUserPostedTracks(req, res, 'PRIVATE'),
);

// ================= GET ===================

tracksPrivateRouter.get(apiVersions.v1 + '/detailed/:id', (req, res) =>
  tracksController.getDetailedTrackInfo(req, res),
);

tracksPrivateRouter.get(
  apiVersions.v1 + '/permalink/valid/:permalink',
  (req, res) => tracksController.isValidPermalink(req, res),
);

tracksPrivateRouter.get(apiVersions.v1 + '/quota', (req, res) =>
  tracksController.getUserQuota(req, res),
);

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
  uploadTrackLimiter,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  (req, res) => tracksController.uploadAudioTrack(req, res),
);

tracksPrivateRouter.post(apiVersions.v1 + '/played/:id', (req, res) =>
  tracksController.addTrackToUserHistory(req, res),
);

export { tracksPublicRouter };
export default tracksPrivateRouter;
