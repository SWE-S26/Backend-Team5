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

tracksPublicRouter.get(apiVersions.v1 + '/posted/:id', (req, res) =>
  tracksController.getUserPostedTracks(req, res, 'PUBLIC'),
);

tracksPublicRouter.get(
  apiVersions.v1 + '/permalink/:profileLink/:permalink',
  (req, res) => tracksController.getTrackByPermalink(req, res, 'PUBLIC'),
);

tracksPublicRouter.get(apiVersions.v1 + '/playlists/:id', (req, res) =>
  tracksController.getPlaylistsContainingTrack(req, res, 'PUBLIC', 'playlist'),
);

tracksPublicRouter.get(apiVersions.v1 + '/albums/:id', (req, res) =>
  tracksController.getPlaylistsContainingTrack(req, res, 'PUBLIC', 'album'),
);

tracksPublicRouter.get(apiVersions.v1 + '/:id', (req, res) =>
  tracksController.getTrackById(req, res, 'PUBLIC'),
);

tracksPublicRouter.get(apiVersions.v1, (req, res) =>
  tracksController.getPaginatedListOfTracks(req, res, 'PUBLIC'),
);

// ======================== PRIVATE =========================

// ================= GET ===================

tracksPrivateRouter.get(apiVersions.v1 + '/quota', (req, res) =>
  tracksController.getUserQuota(req, res),
);

tracksPrivateRouter.get(apiVersions.v1 + '/liked/:id', (req, res) =>
  tracksController.getUserLikedTracks(req, res, 'PRIVATE'),
);

tracksPrivateRouter.get(apiVersions.v1 + '/posted/:id', (req, res) =>
  tracksController.getUserPostedTracks(req, res, 'PRIVATE'),
);

tracksPrivateRouter.get(
  apiVersions.v1 + '/permalink/valid/:permalink',
  (req, res) => tracksController.isValidPermalink(req, res),
);

tracksPrivateRouter.get(
  apiVersions.v1 + '/permalink/:profileLink/:permalink',
  (req, res) => tracksController.getTrackByPermalink(req, res, 'PRIVATE'),
);

tracksPrivateRouter.get(apiVersions.v1 + '/playlists/:id', (req, res) =>
  tracksController.getPlaylistsContainingTrack(req, res, 'PRIVATE', 'playlist'),
);

tracksPrivateRouter.get(apiVersions.v1 + '/albums/:id', (req, res) =>
  tracksController.getPlaylistsContainingTrack(req, res, 'PRIVATE', 'album'),
);

tracksPrivateRouter.get(apiVersions.v1 + '/detailed/:id', (req, res) =>
  tracksController.getDetailedTrackInfo(req, res),
);

tracksPrivateRouter.get(apiVersions.v1, (req, res) =>
  tracksController.getPaginatedListOfTracks(req, res, 'PRIVATE'),
);

tracksPrivateRouter.get(apiVersions.v1 + '/:id', (req, res) =>
  tracksController.getTrackById(req, res, 'PRIVATE'),
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

tracksPrivateRouter.post(apiVersions.v1 + '/played/:id', (req, res) =>
  tracksController.addTrackToUserHistory(req, res),
);

tracksPrivateRouter.post(
  apiVersions.v1,
  uploadTrackLimiter,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  (req, res) => tracksController.uploadAudioTrack(req, res),
);

// ======================================================= V2 ==========================================================

// ====== public ======
tracksPublicRouter.get(apiVersions.v2, (req, res) =>
  tracksController.getPaginatedListOfTracksV2(req, res, 'PUBLIC'),
);

tracksPublicRouter.get(apiVersions.v2 + '/liked/:id', (req, res) =>
  tracksController.getUserLikedTracksV2(req, res, 'PUBLIC'),
);

tracksPublicRouter.get(apiVersions.v2 + '/posted/:id', (req, res) =>
  tracksController.getUserPostedTracksV2(req, res, 'PUBLIC'),
);

tracksPublicRouter.get(apiVersions.v2 + '/stats/:id', (req, res) =>
  tracksController.getTrackStats(req, res),
);

tracksPublicRouter.get(
  apiVersions.v2 + '/permalink/:profileLink/:permalink',
  (req, res) => tracksController.getTrackByPermalinkV2(req, res, 'PUBLIC'),
);

tracksPublicRouter.get(apiVersions.v2 + '/:id', (req, res) =>
  tracksController.getTrackByIdV2(req, res, 'PUBLIC'),
);

// ====== private ======
tracksPrivateRouter.patch(
  apiVersions.v2,
  upload.fields([{ name: 'image', maxCount: 1 }]),
  (req, res) => tracksController.updateTrackInfoV2(req, res),
);

tracksPrivateRouter.patch(apiVersions.v2 + '/download', (req, res) =>
  tracksController.incrementDownloads(req, res),
);

tracksPrivateRouter.patch(apiVersions.v2 + '/listen/', (req, res) =>
  tracksController.incrementTrackNumPlaysV2(req, res),
);

tracksPrivateRouter.post(
  apiVersions.v2,
  uploadTrackLimiter,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  (req, res) => tracksController.uploadAudioTrackV2(req, res),
);

tracksPrivateRouter.get(apiVersions.v2, (req, res) =>
  tracksController.getPaginatedListOfTracksV2(req, res, 'PRIVATE'),
);

tracksPrivateRouter.get(apiVersions.v2 + '/liked/:id', (req, res) =>
  tracksController.getUserLikedTracksV2(req, res, 'PRIVATE'),
);

tracksPrivateRouter.get(apiVersions.v2 + '/posted/:id', (req, res) =>
  tracksController.getUserPostedTracksV2(req, res, 'PRIVATE'),
);

tracksPrivateRouter.get(apiVersions.v2 + '/detailed/:id', (req, res) =>
  tracksController.getDetailedTrackInfoV2(req, res),
);

tracksPrivateRouter.get(apiVersions.v2 + '/stats/:id', (req, res) =>
  tracksController.getTrackStats(req, res),
);

tracksPrivateRouter.get(
  apiVersions.v2 + '/permalink/:profileLink/:permalink',
  (req, res) => tracksController.getTrackByPermalinkV2(req, res, 'PRIVATE'),
);

tracksPrivateRouter.get(apiVersions.v2 + '/:id', (req, res) =>
  tracksController.getTrackByIdV2(req, res, 'PRIVATE'),
);

export { tracksPublicRouter };
export default tracksPrivateRouter;
