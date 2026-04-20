import { Router } from 'express';
import { PlaylistsController } from './playlists.controller';
import apiVersions from '../../shared/middleware/apiVersions';

const playlistsPrivateRouter = Router();
const playlistsPublicRouter = Router();
const playlistsController = new PlaylistsController();

playlistsPrivateRouter.post(
  apiVersions.v1,
  playlistsController.create.bind(playlistsController),
);

playlistsPrivateRouter.delete(
  apiVersions.v1 + '/:id',
  playlistsController.delete.bind(playlistsController),
);

playlistsPublicRouter.get(
  apiVersions.v1,
  playlistsController.findAll.bind(playlistsController),
);

playlistsPublicRouter.get(
  apiVersions.v1 + '/:id',
  playlistsController.findOne.bind(playlistsController),
);

export { playlistsPublicRouter };

export default playlistsPrivateRouter;
