import User from '../../src/shared/models/models.user';
import Track from '../../src/shared/models/models.track';
import logger from '../../src/shared/logger/logger';
import Comment from '../../src/shared/models/models.comment';
import Playlist from '../../src/shared/models/models.playlist';

export const cleanUpBelalMess = async () => {
  try {
    logger.info("Starting cleanup of Belal's mess...");

    await Playlist.deleteMany({}).exec();
    logger.info('All playlists deleted successfully.');

    // await Track.deleteMany({}).exec();
    // logger.info('All tracks deleted successfully.');

    // await Comment.deleteMany({}).exec();
    // logger.info('All comments deleted successfully.');

    logger.info('Cleanup completed successfully.');
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Error during cleanup execution: ${e.message}`);
    } else {
      logger.error({ error: e }, 'Unknown error during cleanup execution:');
    }
  }
};
