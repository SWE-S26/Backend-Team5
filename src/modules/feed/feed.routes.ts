import { Router } from 'express';
import { FeedController } from './feed.controller';
import { FeedRepository } from './feed.repository';
import { FeedService } from './feed.service';

import apiVersions from '../../shared/middleware/apiVersions';

const feedRoutes = Router();
const feedPublicRouter = Router();

const feedRepository = new FeedRepository();
const feedService = new FeedService(feedRepository);
const feedController = new FeedController(feedService);

feedPublicRouter.get(
  apiVersions.v1 + '/trending-tracks/:id',
  feedController.getTrendingTracks.bind(feedController),
);

feedRoutes.get(
  apiVersions.v1 + '/feed',
  feedController.getFeed.bind(feedController),
);

feedRoutes.get(
  apiVersions.v1 + '/search/suggestions',
  feedController.getSearchSuggestions.bind(feedController),
);

feedRoutes.delete(
  apiVersions.v1 + '/search/history/:historyId',
  feedController.deleteSearchHistoryItem.bind(feedController),
);

feedRoutes.get(
  apiVersions.v1 + '/search/history',
  feedController.getSearchHistory.bind(feedController),
);

feedRoutes.post(
  apiVersions.v1 + '/search/add-to-history',
  feedController.addToSearchHistory.bind(feedController),
);

feedRoutes.get(
  apiVersions.v1 + '/search',
  feedController.applyGlobalSearch.bind(feedController),
);

export { feedPublicRouter };
export default feedRoutes;
