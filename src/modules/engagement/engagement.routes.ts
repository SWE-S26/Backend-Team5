import { Router } from 'express';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';
import { EngagementRepository } from './engagement.repository';
import apiVersions from '../../shared/middleware/apiVersions';
import { optionalAuth } from '../../shared/middleware/optionalAuth';

const engagementPublicRouter = Router();
const engagementProtectedRouter = Router();

const engagementController = new EngagementController(
  new EngagementService(new EngagementRepository()),
);

engagementPublicRouter.get(
  '/tracks' + apiVersions.v1 + '/:trackId/likes',
  (req, res) => engagementController.getTrackLikers(req, res),
);

engagementPublicRouter.get(
  '/playlists' + apiVersions.v1 + '/:playlistId/likes',
  (req, res) => engagementController.getPlaylistLikers(req, res),
);

engagementPublicRouter.get(
  '/tracks' + apiVersions.v1 + '/:trackId/reposts',
  (req, res) => engagementController.getTrackReposters(req, res),
);

engagementPublicRouter.get(
  '/tracks' + apiVersions.v1 + '/:trackId/comments',
  optionalAuth,
  (req, res) => engagementController.getTrackComments(req, res),
);

engagementPublicRouter.get(
  '/comments' + apiVersions.v1 + '/:commentId/replies',
  optionalAuth,
  (req, res) => engagementController.getCommentReplies(req, res),
);

engagementPublicRouter.get(
  '/playlists' + apiVersions.v1 + '/:playlistId/reposts',
  (req, res) => engagementController.getPlaylistReposters(req, res),
);

engagementProtectedRouter.post(
  '/tracks' + apiVersions.v1 + '/:trackId/like',
  (req, res) => engagementController.toggleTrackLike(req, res),
);

engagementProtectedRouter.get(
  '/tracks' + apiVersions.v1 + '/:trackId/like',
  (req, res) => engagementController.getTrackLikeStatus(req, res),
);

engagementProtectedRouter.post(
  '/tracks' + apiVersions.v1 + '/:trackId/repost',
  (req, res) => engagementController.toggleTrackRepost(req, res),
);

engagementProtectedRouter.get(
  '/tracks' + apiVersions.v1 + '/:trackId/repost',
  (req, res) => engagementController.getTrackRepostStatus(req, res),
);

engagementProtectedRouter.patch(
  '/tracks' + apiVersions.v1 + '/:trackId/repost',
  (req, res) => engagementController.updateTrackRepostCaption(req, res),
);

engagementProtectedRouter.post(
  '/playlists' + apiVersions.v1 + '/:playlistId/like',
  (req, res) => engagementController.togglePlaylistLike(req, res),
);

engagementProtectedRouter.post(
  '/playlists' + apiVersions.v1 + '/:playlistId/repost',
  (req, res) => engagementController.togglePlaylistRepost(req, res),
);

engagementProtectedRouter.get(
  '/playlists' + apiVersions.v1 + '/:playlistId/repost',
  (req, res) => engagementController.getPlaylistRepostStatus(req, res),
);

engagementProtectedRouter.patch(
  '/playlists' + apiVersions.v1 + '/:playlistId/repost',
  (req, res) => engagementController.updatePlaylistRepostCaption(req, res),
);

engagementProtectedRouter.post(
  '/tracks' + apiVersions.v1 + '/:trackId/comments',
  (req, res) => engagementController.postTrackComment(req, res),
);

engagementProtectedRouter.get(
  '/mentions' + apiVersions.v1 + '/followers',
  (req, res) => engagementController.getMentionFollowers(req, res),
);

engagementProtectedRouter.post(
  '/comments' + apiVersions.v1 + '/:commentId/like',
  (req, res) => engagementController.toggleCommentLike(req, res),
);

engagementProtectedRouter.delete(
  '/comments' + apiVersions.v1 + '/:commentId',
  (req, res) => engagementController.deleteTrackComment(req, res),
);

export { engagementPublicRouter };
export default engagementProtectedRouter;
