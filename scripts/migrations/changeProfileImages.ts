import User from '../../src/shared/models/models.user';
import logger from '../../src/shared/logger/logger';
import {
  NEW_DEFAULT_PROFILE_IMAGE,
  OLD_DEFAULT_PROFILE_IMAGE,
} from '../../src/config/constants';

export const changeProfileImages = async () => {
  try {
    const users = await User.find({
      $or: [
        { 'profileImg.publicId': OLD_DEFAULT_PROFILE_IMAGE.publicId },
        { 'bannerImg.publicId': OLD_DEFAULT_PROFILE_IMAGE.publicId },
      ],
    });

    logger.info(
      { count: users.length },
      'Users with old default images found.',
    );

    const result = await User.updateMany(
      {
        $or: [
          { 'profileImg.publicId': OLD_DEFAULT_PROFILE_IMAGE.publicId },
          { 'bannerImg.publicId': OLD_DEFAULT_PROFILE_IMAGE.publicId },
        ],
      },
      {
        $set: {
          'profileImg.imgLink': OLD_DEFAULT_PROFILE_IMAGE.imgLink,
          'profileImg.publicId': OLD_DEFAULT_PROFILE_IMAGE.publicId,
          'bannerImg.imgLink': OLD_DEFAULT_PROFILE_IMAGE.imgLink,
          'bannerImg.publicId': OLD_DEFAULT_PROFILE_IMAGE.publicId,
        },
      },
    );

    logger.info({ result }, 'Users updated successfully.');

    const updatedUsers = await User.find({
      $or: [
        { 'profileImg.publicId': OLD_DEFAULT_PROFILE_IMAGE.publicId },
        { 'bannerImg.publicId': OLD_DEFAULT_PROFILE_IMAGE.publicId },
      ],
    });

    logger.info(
      { count: updatedUsers.length },
      'Users with old default images found.',
    );
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Error during migration execution: ${e.message}`);
    } else {
      logger.error({ error: e }, 'Unknown error during migration execution:');
    }
  }
};
