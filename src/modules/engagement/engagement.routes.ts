import { Router } from 'express';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';
import { EngagementRepository } from './engagement.repository';
import apiVersions from '../../shared/middleware/apiVersions';

const router = Router();

const engagementController = new EngagementController(
  new EngagementService(new EngagementRepository()),
);

router.post('/tracks' + apiVersions.v1 + '/:trackId/like', (req, res) =>
  engagementController.toggleTrackLike(req, res),
);

router.post('/playlists' + apiVersions.v1 + '/:playlistId/like', (req, res) =>
  engagementController.togglePlaylistLike(req, res),
);

router.get('/tracks' + apiVersions.v1 + '/:trackId/likes', (req, res) =>
  engagementController.getTrackLikers(req, res),
);

export default router;
