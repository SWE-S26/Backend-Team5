import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';
import { requireAuth } from '../../shared/middleware/requireAuth';
import apiVersions from '../../shared/middleware/apiVersions';
import { upload } from '../../shared/middleware/multer.middleware';

const profileRouter = Router();
const profilePublicRouter = Router();
const profileRepository = new ProfileRepository();
const profileService = new ProfileService(profileRepository);
const profileController = new ProfileController(profileService);

profileRouter.get(
  apiVersions.v1 + '/check-profile-link',
  profileController.isProfileLinkTaken.bind(profileController),
);

profilePublicRouter.get(
  apiVersions.v1 + '/profile-link/:profileLink',
  profileController.getProfileByProfileLink.bind(profileController),
);

profilePublicRouter.get(
  apiVersions.v1 + '/:id',
  profileController.getProfileById.bind(profileController),
);
profileRouter.patch(
  apiVersions.v1 + '/',
  profileController.updateProfile.bind(profileController),
);

profileRouter.patch(
  apiVersions.v1 + '/images',
  upload.fields([
    { name: 'profileImg', maxCount: 1 },
    { name: 'bannerImg', maxCount: 1 },
  ]),
  profileController.updateProfileImages.bind(profileController),
);

profileRouter.get(
  apiVersions.v1 + '/settings/privacy',
  profileController.getPrivacySettings.bind(profileController),
);
profileRouter.patch(
  apiVersions.v1 + '/settings/privacy',
  profileController.updatePrivacySettings.bind(profileController),
);

profileRouter.get(
  apiVersions.v1 + '/settings/notifications',
  profileController.getNotificationsSettings.bind(profileController),
);
profileRouter.patch(
  apiVersions.v1 + '/settings/notifications',
  profileController.updateNotificationsSettings.bind(profileController),
);

profileRouter.get(
  apiVersions.v1 + '/settings/account',
  profileController.getAccountSettings.bind(profileController),
);
profileRouter.patch(
  apiVersions.v1 + '/settings/account',
  profileController.updateAccountSettings.bind(profileController),
);

profileRouter.get(
  apiVersions.v1 + '/settings/content',
  profileController.getContentSettings.bind(profileController),
);
profileRouter.patch(
  apiVersions.v1 + '/settings/content',
  profileController.updateContentSettings.bind(profileController),
);

export { profilePublicRouter };

export default profileRouter;
