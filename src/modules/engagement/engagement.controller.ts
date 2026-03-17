import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { EngagementService } from './engagement.service';
import {
  GetPlaylistLikersRequestDTO,
  GetTrackLikersRequestDTO,
  ToggleTrackLikeRequestDTO,
  TogglePlaylistLikeRequestDTO,
} from './dtos/engagement.request';
import { BadRequestError } from '../../shared/errors/responseErrors';

export class EngagementController {
  constructor(private readonly service: EngagementService) {}

  async toggleTrackLike(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(ToggleTrackLikeRequestDTO, req);
    if (!parsed.success) BadRequestError(parsed.error.message);

    const { trackId } = parsed.data!.params;
    const userId = req.userInfo!._id;

    const result = await this.service.toggleTrackLike(trackId, userId);
    res.json(result);
  }

  async togglePlaylistLike(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(TogglePlaylistLikeRequestDTO, req);
    if (!parsed.success) BadRequestError(parsed.error.message);

    const { playlistId } = parsed.data!.params;
    const userId = req.userInfo!._id;

    const result = await this.service.togglePlaylistLike(playlistId, userId);
    res.json(result);
  }

  async getTrackLikers(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetTrackLikersRequestDTO, req);
    if (!parsed.success) BadRequestError(parsed.error.message);

    const { trackId } = parsed.data!.params;
    const { offset, limit } = parsed.data!.query;

    const result = await this.service.getTrackLikers(trackId, offset, limit);
    res.json(result);
  }

  async getPlaylistLikers(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetPlaylistLikersRequestDTO, req);
    if (!parsed.success) BadRequestError(parsed.error.message);

    const { playlistId } = parsed.data!.params;
    const { offset, limit } = parsed.data!.query;

    const result = await this.service.getPlaylistLikers(playlistId, offset, limit);
    res.json(result);
  }
}
