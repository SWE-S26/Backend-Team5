import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';
import { requireAuth } from '../../shared/middleware/requireAuth';
import apiVersions from '../../shared/middleware/apiVersions';

const profileRouter = Router();
const profileRepository = new ProfileRepository();
const profileService = new ProfileService(profileRepository);
const profileController = new ProfileController(profileService);

profileRouter.get(
  apiVersions.v1 + '/:id',
  profileController.findOne.bind(profileController),
);
profileRouter.patch(
  apiVersions.v1 + '/',
  requireAuth,
  profileController.update.bind(profileController),
);

export default profileRouter;
