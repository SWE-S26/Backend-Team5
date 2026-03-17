import { Router } from 'express';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';
import { EngagementRepository } from './engagement.repository';
import apiVersions from '../../shared/middleware/apiVersions';

const router = Router();

const engagementController = new EngagementController(
  new EngagementService(new EngagementRepository()),
);

router.post(apiVersions.v1 + '/tracks/:trackId/like', (req, res) =>
  engagementController.toggleTrackLike(req, res),
);

export default router;
