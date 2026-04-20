import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { PlaylistsService } from './playlists.service';
import {
  FindAllPlaylistsDTO,
  FindOnePlaylistDTO,
  CreatePlaylistDTO,
  DeletePlaylistDTO,
} from './dtos/playlists.request';

export class PlaylistsController {
  private readonly service: PlaylistsService = new PlaylistsService();
  constructor() {}

  async findAll(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(FindAllPlaylistsDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { offset, limit } = validatedRequest.data.query;
    const playlists = await this.service.findAll(offset, limit);

    res.json({
      message: 'Playlists retrieved successfully',
      data: {
        playlists,
      },
    });
  }

  async findOne(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(FindOnePlaylistDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { id } = validatedRequest.data.params;

    const playlist = await this.service.findById(id);
    res.json({
      message: 'Playlist retrieved successfully',
      data: { playlist },
    });
  }

  async create(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(CreatePlaylistDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const artistId = req.userInfo!._id;

    const { playlistName, isPrivate, tracks } = validatedRequest.data.body;

    const playlist = await this.service.create(
      playlistName,
      artistId,
      tracks,
      isPrivate,
    );
    res.json({
      message: 'Playlist created successfully',
      data: { playlist },
    });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(DeletePlaylistDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { id } = validatedRequest.data.params;

    const deleted = await this.service.delete(id);
    res.json({
      message: 'Playlist deleted successfully',
      data: { deleted },
    });
  }
}
