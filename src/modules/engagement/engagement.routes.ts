import { Router } from 'express';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';
import { EngagementRepository } from './engagement.repository';
import apiVersions from '../../shared/middleware/apiVersions';

const engagementPublicRouter = Router();
const engagementProtectedRouter = Router();

const engagementController = new EngagementController(
  new EngagementService(new EngagementRepository()),
);

engagementPublicRouter.get('/tracks' + apiVersions.v1 + '/:trackId/likes', (req, res) =>
  engagementController.getTrackLikers(req, res),
);

engagementPublicRouter.get('/playlists' + apiVersions.v1 + '/:playlistId/likes', (req, res) =>
  engagementController.getPlaylistLikers(req, res),
);

engagementProtectedRouter.post('/tracks' + apiVersions.v1 + '/:trackId/like', (req, res) =>
  engagementController.toggleTrackLike(req, res),
);

engagementProtectedRouter.post('/playlists' + apiVersions.v1 + '/:playlistId/like', (req, res) =>
  engagementController.togglePlaylistLike(req, res),
);

export { engagementPublicRouter };
export default engagementProtectedRouter;
