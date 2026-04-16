import Track from '../../src/shared/models/models.track';
import logger from '../../src/shared/logger/logger';
import {
  OLD_DEFAULT_AUDIO_IMAGE,
  NEW_DEFAULT_AUDIO_IMAGE,
} from '../../src/config/constants';

export const changeTracksImages = async () => {
  try {
    const tracks = await Track.find({
      'image.publicId': OLD_DEFAULT_AUDIO_IMAGE.publicId,
    });

    logger.info({ tracks }, 'Tracks with old default image found.');

    const result = await Track.updateMany(
      {
        'image.publicId': OLD_DEFAULT_AUDIO_IMAGE.publicId,
      },
      {
        $set: {
          'image.imgLink': NEW_DEFAULT_AUDIO_IMAGE.imgLink,
          'image.publicId': NEW_DEFAULT_AUDIO_IMAGE.publicId,
        },
      },
    );

    logger.info({ result }, 'Successfully updated tracks with default image.');
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Error during migration execution: ${e.message}`);
    } else {
      logger.error({ error: e }, 'Unknown error during migration execution:');
    }
  }
};
