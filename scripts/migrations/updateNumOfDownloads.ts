import logger from '../../src/shared/logger/logger';
import 'dotenv/config';
import Track from '../../src/shared/models/models.track';

export const updateNumOfDownloads = async (): Promise<void> => {
  await Track.updateMany(
    { numOfDownloads: { $exists: false } },
    { $set: { numOfDownloads: 0 } },
  );

  logger.info(`Updated Tracks with No Number Of Downloads`);
};
