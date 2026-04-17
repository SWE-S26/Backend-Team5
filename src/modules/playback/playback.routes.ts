import { Router } from 'express';
import { PlaybackController } from './playback.controller';
import apiVersions from '../../shared/middleware/apiVersions';

const playbackRouter = Router();
const playbackController = new PlaybackController();

playbackRouter.get(apiVersions.v1 + '/history/tracks', (req, res) =>
  playbackController.getUserHistoryTracks(req, res),
);

export default playbackRouter;
