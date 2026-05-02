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
  UpdatePlaylistSingleTrackOrderDTO,
  UpdatePlaylistInfoInput,
  UpdatePlaylistInfoDTO,
  AddTrackToPlaylistDTO,
  GetPlaylistByPermalinkDTO,
  CreatePlaylistWithImageDTO,
  CreatePlaylistWithImageInput,
  GetByPermaLinkDTO,
} from './dtos/playlists.request';
import {
  BadRequestError,
  ForbiddenError,
} from '../../shared/errors/responseErrors';
import logger from '../../shared/logger/logger';

export class PlaylistsController {
  private readonly service: PlaylistsService = new PlaylistsService();
  constructor() {}

  private extractImageFile(req: Request) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    return files?.image?.[0];
  }

  private getUserIdFromRequest(req: Request): string | null {
    if (req.userInfo) {
      return req.userInfo._id;
    }
    return null;
  }

  private stopAdmins(userRole: string): void {
    if (userRole === 'admin') {
      throw ForbiddenError('Admins are not allowed to perform this action');
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(FindAllPlaylistsDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userId = this.getUserIdFromRequest(req);

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

    const userId = this.getUserIdFromRequest(req);

    const { limit, offset } = validatedRequest.data.query;

    const playlist = await this.service.findById(id, userId, offset, limit);

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

    this.stopAdmins(req.userInfo!.role);

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

  async createWithImage(req: Request, res: Response): Promise<void> {
    const imageFile = this.extractImageFile(req);
    logger.debug(req.body);
    try {
      req.body = JSON.parse(req.body.data);
    } catch (err) {
      throw BadRequestError('Invalid JSON in "data" field');
    }

    this.stopAdmins(req.userInfo!.role);

    logger.info(
      { body: req.body },
      'Parsed request body for updating playlist',
    );

    const validateRequest = parseRequest(CreatePlaylistWithImageDTO, req);
    if (!validateRequest.success) {
      throw validateRequest.error;
    }

    const infoTotal: CreatePlaylistWithImageInput = {
      ...validateRequest.data,
      imageFile,
    };

    const { role, _id } = req.userInfo!;

    this.service.validateNumberOfPostedPlaylists(_id, role);
    const userId = req.userInfo!._id;
    const playlist = await this.service.createPlaylistWithImage(
      infoTotal,
      userId,
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

    const deleted = await this.service.delete(id, req.userInfo!._id);
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

    this.stopAdmins(req.userInfo!.role);

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

  async addPlaylistToHistory(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(DeletePlaylistDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    this.stopAdmins(req.userInfo!.role);

    const { id } = validatedRequest.data.params;
    const userId = req.userInfo!._id;

    await this.service.addPlaylistToHistory(id, userId);

    res.json({
      message: 'Playlist added to history successfully',
      data: null,
    });
  }

  async updatePlaylistSingleTrackOrder(
    req: Request,
    res: Response,
  ): Promise<void> {
    const validatedRequest = parseRequest(
      UpdatePlaylistSingleTrackOrderDTO,
      req,
    );

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    this.stopAdmins(req.userInfo!.role);

    const { id } = validatedRequest.data.params;
    const { trackId, oldPosition, newPosition } = validatedRequest.data.body;
    const userId = req.userInfo!._id;

    await this.service.updateOrderOfSingleTrack(
      id,
      trackId,
      oldPosition,
      newPosition,
      userId,
    );

    res.json({
      message: 'Updated Playlist track order successfully.',
    });
  }

  async updatePlaylist(req: Request, res: Response): Promise<void> {
    const imageFile = this.extractImageFile(req);
    try {
      req.body = JSON.parse(req.body.data);
    } catch (err) {
      throw BadRequestError('Invalid JSON in "data" field');
    }

    this.stopAdmins(req.userInfo!.role);

    logger.info(
      { body: req.body },
      'Parsed request body for updating playlist',
    );

    const validateRequest = parseRequest(UpdatePlaylistInfoDTO, req);
    if (!validateRequest.success) {
      throw validateRequest.error;
    }

    const infoTotal: UpdatePlaylistInfoInput = {
      ...validateRequest.data,
      imageFile,
    };

    const userId = req.userInfo!._id;
    await this.service.updatePlaylist(infoTotal, userId);

    res.json({ message: 'Playlist updated successfully' });
  }

  async addTrackToPlaylist(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(AddTrackToPlaylistDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    this.stopAdmins(req.userInfo!.role);

    const { id, trackId } = validatedRequest.data.params;
    const userId = req.userInfo!._id;

    await this.service.addTrackToPlaylist(id, trackId, userId);

    res.json({
      message: 'Track added to playlist successfully',
    });
  }

  async removeTrackFromPlaylist(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(AddTrackToPlaylistDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    this.stopAdmins(req.userInfo!.role);

    const { id, trackId } = validatedRequest.data.params;
    const userId = req.userInfo!._id;

    await this.service.removeTrackFromPlaylist(id, trackId, userId);

    res.json({
      message: 'Track removed from playlist successfully',
    });
  }

  async getAlbumsOfAnArtist(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(FindOnePlaylistDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const { id } = validatedRequest.data.params;
    const { offset, limit } = validatedRequest.data.query;
    let userId = null;

    if (req.userInfo) {
      userId = req.userInfo._id;
    }

    const albums = await this.service.getAlbumsOfAnArtist(
      id,
      userId,
      limit,
      offset,
    );

    res.json({
      message: 'Albums for artist retrieved successfully',
      data: { albums },
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

    let userId: string | null = null;
    if (req.userInfo) {
      userId = req.userInfo._id;
    }

    const { playlistId, artistId } = validatedRequest.data.params;
    const playlists = await this.service.getMorePlaylistsFromArtist(
      artistId,
      playlistId,
      userId,
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

  async getPlaylistByPermalink(req: Request, res: Response): Promise<void> {
    const validateRequest = parseRequest(GetPlaylistByPermalinkDTO, req);
    if (!validateRequest.success) {
      throw validateRequest.error;
    }

    const { permalink } = validateRequest.data.params;

    const userId = this.getUserIdFromRequest(req);

    const playlist = await this.service.getByPermalink(permalink, userId);

    if (!playlist) {
      throw BadRequestError('Playlist with the given permalink not found');
    }

    res.json({
      message: 'Playlist retrieved successfully',
      data: { playlist },
    });
  }

  async getPlaylistByPermalinkAndProfileLink(
    req: Request,
    res: Response,
  ): Promise<void> {
    const validateRequest = parseRequest(GetByPermaLinkDTO, req);
    if (!validateRequest.success) {
      throw validateRequest.error;
    }

    const { permalink, profilelink } = validateRequest.data.params;
    const { limit, offset } = validateRequest.data.query;

    const userId = this.getUserIdFromRequest(req);

    const playlist = await this.service.getByPermaLinkAndProfileLink(
      permalink,
      profilelink,
      userId,
      limit,
      offset,
    );

    if (!playlist) {
      throw BadRequestError('Playlist with the given permalink not found');
    }

    res.json({
      message: 'Playlist retrieved successfully',
      data: { playlist },
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
