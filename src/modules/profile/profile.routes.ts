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
  profileController.getProfile.bind(profileController),
);
profileRouter.patch(
  apiVersions.v1 + '/',
  profileController.updateProfile.bind(profileController),
);

profileRouter.get(
  apiVersions.v1 + '/settings/privacy',
  profileController.getPrivacySettings.bind(profileController),
);
profileRouter.patch(
  apiVersions.v1 + '/settings/privacy',
  profileController.updatePrivacySettings.bind(profileController),
);

export default profileRouter;
