import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { EngagementService } from './engagement.service';
import { ToggleTrackLikeRequestDTO } from './dtos/engagement.request';
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
}
