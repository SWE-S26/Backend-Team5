import { Router } from 'express';
import { playlistsController } from './playlists.controller';

export const playlistsRouter = Router();
//TODO: const playlistsController = new PlaylistsController(/* TODO: inject service */);

// playlistsRouter.get('/',      (req, res) => playlistsController.findAll(req, res));
// playlistsRouter.get('/:id',   (req, res) => playlistsController.findOne(req, res));
// playlistsRouter.post('/',     (req, res) => playlistsController.create(req, res));
// playlistsRouter.put('/:id',   (req, res) => playlistsController.replace(req, res));
// playlistsRouter.patch('/:id', (req, res) => playlistsController.update(req, res));
// playlistsRouter.delete('/:id',(req, res) => playlistsController.remove(req, res));
