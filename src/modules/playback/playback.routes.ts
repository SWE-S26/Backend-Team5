import { Router } from 'express';
import { PlaybackController } from './playback.controller';
import apiVersions from '../../shared/middleware/apiVersions';

const playbackRouter = Router();
const playbackController = new PlaybackController();

playbackRouter.get(apiVersions.v1 + '/history/tracks', (req, res) =>
  playbackController.getUserHistoryTracks(req, res),
);

playbackRouter.get(apiVersions.v1 + '/history/playlists', (req, res) =>
  playbackController.getUserHistoryPlaylists(req, res),
);

playbackRouter.delete(apiVersions.v1 + '/history/', (req, res) =>
  playbackController.deleteUserHistory(req, res),
);

export default playbackRouter;
