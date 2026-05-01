import Playlist from '../../src/shared/models/models.playlist';
import Track from '../../src/shared/models/models.track';
import logger from '../../src/shared/logger/logger';

export const addMobileViewField = async () => {
  const result = await Track.updateMany(
    {},
    { $set: { mobileProPreview: false } },
  );
  logger.info(
    `Updated ${result.modifiedCount} tracks with mobileProPreview field.`,
  );
};
