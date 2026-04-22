import { Router } from 'express';
import { PlaylistsController } from './playlists.controller';
import apiVersions from '../../shared/middleware/apiVersions';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

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

playlistsPrivateRouter.patch(
  apiVersions.v1 + '/:id/image',
  upload.fields([{ name: 'image', maxCount: 1 }]),
  playlistsController.updatePlaylistPicture.bind(playlistsController),
);

playlistsPrivateRouter.patch(
  apiVersions.v1 + '/:id/tracks/order',
  playlistsController.updatePlaylistSingleTrackOrder.bind(playlistsController),
);

playlistsPublicRouter.get(
  apiVersions.v1,
  playlistsController.findAll.bind(playlistsController),
);

playlistsPrivateRouter.get(
  apiVersions.v1,
  playlistsController.findAll.bind(playlistsController),
);

playlistsPrivateRouter.get(
  apiVersions.v1 + '/my-playlists',
  playlistsController.getMyPlaylists.bind(playlistsController),
);

playlistsPrivateRouter.get(
  apiVersions.v1 + '/playlists/:id',
  playlistsController.getPlaylistsForArtist.bind(playlistsController),
);

playlistsPublicRouter.get(
  apiVersions.v1 + '/playlists/:id',
  playlistsController.getPlaylistsForArtist.bind(playlistsController),
);

playlistsPublicRouter.get(
  apiVersions.v1 + '/creator/:id',
  playlistsController.getArtistDetails.bind(playlistsController),
);

playlistsPrivateRouter.get(
  apiVersions.v1 + '/creator/:id',
  playlistsController.getArtistDetails.bind(playlistsController),
);

playlistsPrivateRouter.get(
  apiVersions.v1 + '/:playlistId/recommend/:artistId',
  playlistsController.getMorePlaylistsFromArtist.bind(playlistsController),
);

playlistsPublicRouter.get(
  apiVersions.v1 + '/:playlistId/recommend/:artistId',
  playlistsController.getMorePlaylistsFromArtist.bind(playlistsController),
);

playlistsPublicRouter.get(
  apiVersions.v1 + '/:id',
  playlistsController.findById.bind(playlistsController),
);

playlistsPrivateRouter.get(
  apiVersions.v1 + '/:id',
  playlistsController.findById.bind(playlistsController),
);

export { playlistsPublicRouter };

export default playlistsPrivateRouter;
