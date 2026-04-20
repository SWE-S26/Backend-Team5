import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { PlaylistsService } from './playlists.service';
import {
  FindAllPlaylistsDTO,
  FindOnePlaylistDTO,
  CreatePlaylistDTO,
  DeletePlaylistDTO,
  GetArtistDetailsDTO,
  GetMorePlaylistsFromArtistDTO,
} from './dtos/playlists.request';
import { BadRequestError } from '../../shared/errors/responseErrors';

export class PlaylistsController {
  private readonly service: PlaylistsService = new PlaylistsService();
  constructor() {}

  private extractImageFile(req: Request) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    return files?.image?.[0];
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(FindAllPlaylistsDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    let userId: string | null = null;
    if (req.userInfo) {
      userId = req.userInfo._id;
    }

    const { offset, limit } = validatedRequest.data.query;
    const playlists = await this.service.findAll(offset, limit, userId);

    res.json({
      message: 'Playlists retrieved successfully',
      data: {
        playlists,
      },
    });
  }

  async findById(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(FindOnePlaylistDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { id } = validatedRequest.data.params;

    let userId: string | null = null;
    if (req.userInfo) {
      userId = req.userInfo._id;
    }

    const playlist = await this.service.findById(
      id,
      userId,
      validatedRequest.data.query.offset,
    );

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

    const { role, _id } = req.userInfo!;

    this.service.validateNumberOfPostedPlaylists(_id, role);

    const { playlistName, isPrivate, tracks } = validatedRequest.data.body;

    const playlist = await this.service.create(
      playlistName,
      _id,
      tracks,
      isPrivate,
    );

    res.status(201).json({
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

  async updatePlaylistPicture(req: Request, res: Response): Promise<void> {
    const imageFile = this.extractImageFile(req);
    if (!imageFile) {
      throw BadRequestError(
        'Image file is required for updating playlist picture',
      );
    }

    const validatedRequest = parseRequest(FindOnePlaylistDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { id } = validatedRequest.data.params;
    const userId = req.userInfo!._id;

    const updatedPlaylist = await this.service.updateImage(
      id,
      imageFile,
      userId,
    );

    res.json({
      message: 'Playlist picture updated successfully',
      data: { playlist: updatedPlaylist },
    });
  }

  async updatePlaylist(req: Request, res: Response): Promise<void> {
    res.status(502).json({
      message: 'Updating playlist info is not implemented yet',
    });
  }

  async getArtistDetails(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(GetArtistDetailsDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { id } = validatedRequest.data.params;

    let userId: string | null = null;
    if (req.userInfo) {
      userId = req.userInfo._id;
    }

    const artistDetails = await this.service.getArtistDetails(id, userId);

    res.json({
      message: 'Artist details retrieved successfully',
      data: { artist: artistDetails },
    });
  }

  async getMorePlaylistsFromArtist(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(GetMorePlaylistsFromArtistDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { playlistId, artistId } = validatedRequest.data.params;
    const playlists = await this.service.getMorePlaylistsFromArtist(
      artistId,
      playlistId,
    );

    res.json({
      message: 'More playlists from same artist retrieved successfully',
      data: { playlists },
    });
  }

  async getMyPlaylists(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(FindAllPlaylistsDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userId = req.userInfo!._id;
    const { offset, limit } = validatedRequest.data.query;

    const playlists = await this.service.getMyPlaylists(userId, offset, limit);

    res.json({
      message: 'My playlists retrieved successfully',
      data: {
        playlists,
      },
    });
  }

  async getPlaylistsForArtist(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(FindOnePlaylistDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { id } = validatedRequest.data.params;

    const { offset, limit } = validatedRequest.data.query;

    let userId: string | null = null;
    if (req.userInfo) {
      userId = req.userInfo._id;
    }

    const playlists = await this.service.getPlaylistsForArtist(
      id,
      offset,
      limit,
      userId,
    );

    res.json({
      message: 'Playlists for artist retrieved successfully',
      data: { playlists },
    });
  }
}
