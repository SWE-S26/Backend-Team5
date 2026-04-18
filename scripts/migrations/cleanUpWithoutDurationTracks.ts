import logger from '../../src/shared/logger/logger';
import 'dotenv/config';
import Track from '../../src/shared/models/models.track';

export const deleteTracksWithoutDuration = async (): Promise<void> => {
  const result = await Track.deleteMany({
    durationInSecond: { $exists: false },
  });

  logger.info(`Deleted ${result.deletedCount} Tracks with No Duration`);
};
