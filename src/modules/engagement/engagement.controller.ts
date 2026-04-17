import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { EngagementService } from './engagement.service';
import {
  GetPlaylistLikersRequestDTO,
  GetTrackLikeStatusRequestDTO,
  GetTrackLikersRequestDTO,
  ToggleTrackLikeRequestDTO,
  TogglePlaylistLikeRequestDTO,
  ToggleTrackRepostRequestDTO,
  GetTrackRepostStatusRequestDTO,
  UpdateTrackRepostRequestDTO,
  TogglePlaylistRepostRequestDTO,
  GetPlaylistRepostStatusRequestDTO,
  UpdatePlaylistRepostRequestDTO,
  GetTrackRepostersRequestDTO,
  GetPlaylistRepostersRequestDTO,
  PostTrackCommentRequestDTO,
  ToggleCommentLikeRequestDTO,
  GetTrackCommentsRequestDTO,
  GetCommentRepliesRequestDTO,
  DeleteTrackCommentRequestDTO,
} from './dtos/engagement.request';

export class EngagementController {
  constructor(private readonly service: EngagementService) {}

  async toggleTrackLike(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(ToggleTrackLikeRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { trackId } = parsed.data!.params;
    const userId = req.userInfo!._id;

    const result = await this.service.toggleTrackLike(trackId, userId);
    res.json(result);
  }

  async toggleTrackRepost(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(ToggleTrackRepostRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { trackId } = parsed.data!.params;
    const userId = req.userInfo!._id;
    const caption = parsed.data!.body?.caption;

    const result = await this.service.toggleTrackRepost(
      trackId,
      userId,
      caption,
    );
    res.json(result);
  }

  async togglePlaylistLike(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(TogglePlaylistLikeRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { playlistId } = parsed.data!.params;
    const userId = req.userInfo!._id;

    const result = await this.service.togglePlaylistLike(playlistId, userId);
    res.json(result);
  }

  async getTrackLikers(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetTrackLikersRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { trackId } = parsed.data!.params;
    const { offset, limit } = parsed.data!.query;

    const result = await this.service.getTrackLikers(trackId, offset, limit);
    res.json(result);
  }

  async getPlaylistLikers(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetPlaylistLikersRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { playlistId } = parsed.data!.params;
    const { offset, limit } = parsed.data!.query;

    const result = await this.service.getPlaylistLikers(
      playlistId,
      offset,
      limit,
    );
    res.json(result);
  }

  async getTrackLikeStatus(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetTrackLikeStatusRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { trackId } = parsed.data!.params;
    const userId = req.userInfo!._id;

    const result = await this.service.getTrackLikeStatus(trackId, userId);
    res.json(result);
  }

  async getTrackRepostStatus(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetTrackRepostStatusRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { trackId } = parsed.data!.params;
    const userId = req.userInfo!._id;

    const result = await this.service.getTrackRepostStatus(trackId, userId);
    res.json(result);
  }

  async updateTrackRepostCaption(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(UpdateTrackRepostRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { trackId } = parsed.data!.params;
    const { caption } = parsed.data!.body;
    const userId = req.userInfo!._id;

    const result = await this.service.updateTrackRepostCaption(
      trackId,
      userId,
      caption,
    );
    res.json(result);
  }

  async togglePlaylistRepost(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(TogglePlaylistRepostRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { playlistId } = parsed.data!.params;
    const userId = req.userInfo!._id;
    const caption = parsed.data!.body?.caption;

    const result = await this.service.togglePlaylistRepost(
      playlistId,
      userId,
      caption,
    );
    res.json(result);
  }

  async getPlaylistRepostStatus(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetPlaylistRepostStatusRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { playlistId } = parsed.data!.params;
    const userId = req.userInfo!._id;

    const result = await this.service.getPlaylistRepostStatus(
      playlistId,
      userId,
    );
    res.json(result);
  }

  async updatePlaylistRepostCaption(
    req: Request,
    res: Response,
  ): Promise<void> {
    const parsed = parseRequest(UpdatePlaylistRepostRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { playlistId } = parsed.data!.params;
    const { caption } = parsed.data!.body;
    const userId = req.userInfo!._id;

    const result = await this.service.updatePlaylistRepostCaption(
      playlistId,
      userId,
      caption,
    );
    res.json(result);
  }

  async getTrackReposters(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetTrackRepostersRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { trackId } = parsed.data!.params;
    const { offset, limit } = parsed.data!.query;

    const result = await this.service.getTrackReposters(trackId, offset, limit);
    res.json(result);
  }

  async getPlaylistReposters(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetPlaylistRepostersRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { playlistId } = parsed.data!.params;
    const { offset, limit } = parsed.data!.query;

    const result = await this.service.getPlaylistReposters(
      playlistId,
      offset,
      limit,
    );
    res.json(result);
  }

  async postTrackComment(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(PostTrackCommentRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { trackId } = parsed.data!.params;
    const { content, timestamp, parentCommentId } = parsed.data!.body;
    const userId = req.userInfo!._id;

    const result = await this.service.postTrackComment(
      trackId,
      userId,
      content,
      timestamp,
      parentCommentId,
    );
    res.status(201).json(result);
  }

  async toggleCommentLike(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(ToggleCommentLikeRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { commentId } = parsed.data!.params;
    const userId = req.userInfo!._id;

    const result = await this.service.toggleCommentLike(commentId, userId);
    res.json(result);
  }

  async getTrackComments(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetTrackCommentsRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { trackId } = parsed.data!.params;
    const { offset, limit, sortBy } = parsed.data!.query;

    const result = await this.service.getTrackComments(
      trackId,
      offset,
      limit,
      sortBy,
    );
    res.json(result);
  }

  async getCommentReplies(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetCommentRepliesRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { commentId } = parsed.data!.params;
    const { offset, limit } = parsed.data!.query;

    const result = await this.service.getCommentReplies(
      commentId,
      offset,
      limit,
    );
    res.json(result);
  }

  async deleteTrackComment(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(DeleteTrackCommentRequestDTO, req);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { commentId } = parsed.data!.params;
    const userId = req.userInfo!._id;

    const result = await this.service.deleteTrackComment(commentId, userId);
    res.json(result);
  }
}
