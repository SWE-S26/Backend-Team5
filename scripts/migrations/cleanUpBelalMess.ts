import User from '../../src/shared/models/models.user';
import Track from '../../src/shared/models/models.track';
import logger from '../../src/shared/logger/logger';
import Comment from '../../src/shared/models/models.comment';
import Playlist from '../../src/shared/models/models.playlist';
import History from '../../src/shared/models/models.history';
import Plays from '../../src/shared/models/models.plays';
import PlaysTrackHandling from '../../src/shared/models/models.plays-track-handling';

export const cleanUpBelalMess = async () => {
  try {
    logger.info("Starting cleanup of Belal's mess...");

    await Playlist.deleteMany({}).exec();
    logger.info('All playlists deleted successfully.');

    await Track.deleteMany({}).exec();
    logger.info('All tracks deleted successfully.');

    const comments = await Comment.find({}).exec();
    await Promise.all(comments.map((comment) => comment.deleteOne()));
    logger.info('All comments deleted successfully.');

    await History.deleteMany({}).exec();
    logger.info('All history records deleted successfully.');

    await Plays.deleteMany({}).exec();
    logger.info('All play records deleted successfully.');

    await PlaysTrackHandling.deleteMany({}).exec();
    logger.info('All plays-track-handling records deleted successfully.');

    logger.info('Cleanup completed successfully.');
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Error during cleanup execution: ${e.message}`);
    } else {
      logger.error({ error: e }, 'Unknown error during cleanup execution:');
    }
  }
};
