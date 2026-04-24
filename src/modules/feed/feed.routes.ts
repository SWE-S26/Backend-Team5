import { Router } from 'express';
import { FeedController } from './feed.controller';
import { FeedRepository } from './feed.repository';
import { FeedService } from './feed.service';

import apiVersions from '../../shared/middleware/apiVersions';

const feedRoutes = Router();

const feedRepository = new FeedRepository();
const feedService = new FeedService(feedRepository);
const feedController = new FeedController(feedService);

feedRoutes.get(
  apiVersions.v1 + '/trending-tracks/:id',
  feedController.getTrendingTracks.bind(feedController),
);

feedRoutes.get(
  apiVersions.v1 + '/feed',
  feedController.getFeed.bind(feedController),
);

export default feedRoutes;
