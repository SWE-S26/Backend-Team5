import { Router } from 'express';
import { FollowingController } from './following.controller';
import { FollowingRepository } from './following.repository';
import { FollowingService } from './following.service';
import apiVersions from '../../shared/middleware/apiVersions';

const followingRouter = Router();
const followingPublicRouter = Router();

const followingRepository = new FollowingRepository();
const followingService = new FollowingService(followingRepository);
const followingController = new FollowingController(followingService);

followingRouter.post(
  apiVersions.v1 + '/follow/:id',
  followingController.addFollower.bind(followingController),
);

followingRouter.post(
  apiVersions.v1 + '/unfollow/:id',
  followingController.removeFollower.bind(followingController),
);

followingRouter.post(
  apiVersions.v1 + '/block/:id',
  followingController.block.bind(followingController),
);

followingRouter.post(
  apiVersions.v1 + '/unblock/:id',
  followingController.unblock.bind(followingController),
);

followingRouter.get(
  apiVersions.v1 + '/followers/:id',
  followingController.getFollowers.bind(followingController),
);

followingRouter.get(
  apiVersions.v1 + '/following/:id',
  followingController.getFollowed.bind(followingController),
);

followingPublicRouter.get(
  apiVersions.v1 + '/followers/:id',
  followingController.getFollowers.bind(followingController),
);

followingPublicRouter.get(
  apiVersions.v1 + '/following/:id',
  followingController.getFollowed.bind(followingController),
);

followingRouter.get(
  apiVersions.v1 + '/blocked',
  followingController.getBlocked.bind(followingController),
);

followingRouter.get(
  apiVersions.v1 + '/suggested',
  followingController.getSuggestedUsers.bind(followingController),
);

export { followingPublicRouter };
export default followingRouter;
