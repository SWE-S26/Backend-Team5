import Track, { ITrack } from '../../src/shared/models/models.track';
import logger from '../../src/shared/logger/logger';
import mongoose from 'mongoose';
import {
  DEFAULT_AUDIO_IMAGE,
  DEFAULT_FAMILY_FRIENDLY_IMAGE,
} from '../../src/config/constants';

export const cleanUpTracks = async () => {
  try {
    const tracks = await Track.find({
      'image.publicId': DEFAULT_AUDIO_IMAGE.publicId,
    });

    logger.info({ tracks }, 'Tracks with default image found.');

    const result = await Track.updateMany(
      { 'image.publicId': DEFAULT_AUDIO_IMAGE.publicId },
      {
        $set: {
          'image.imgLink': DEFAULT_FAMILY_FRIENDLY_IMAGE.url,
          'image.publicId': DEFAULT_FAMILY_FRIENDLY_IMAGE.publicId,
        },
      },
    );

    logger.info({ result }, 'Successfully updated tracks with default image.');

    const updatedTracks = await Track.find({
      'image.publicId': DEFAULT_FAMILY_FRIENDLY_IMAGE.publicId,
    });
    logger.info({ updatedTracks }, 'Tracks with updated default image found.');
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Error during migration execution: ${e.message}`);
    } else {
      logger.error({ error: e }, 'Unknown error during migration execution:');
    }
  }
};
