import Settings from '../../src/shared/models/models.settings';
import logger from '../../src/shared/logger/logger';

export const cleanUpDeletedUsers = async () => {
  try {
    logger.info('Identifying orphaned settings...');

    const orphanedSettings = await Settings.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user_info',
        },
      },
      {
        $match: {
          user_info: { $size: 0 },
        },
      },
      {
        $project: { _id: 1 },
      },
    ]);

    const orphanedIds = orphanedSettings.map((doc) => doc._id);

    if (orphanedIds.length > 0) {
      logger.info(`Found ${orphanedIds.length} orphaned settings. Deleting...`);

      const result = await Settings.deleteMany({
        _id: { $in: orphanedIds },
      });

      logger.info(
        `Successfully deleted ${result.deletedCount} orphaned settings.`,
      );
    } else {
      logger.info('No orphaned settings found. Database is clean.');
    }
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Error during migration execution: ${e.message}`);
    } else {
      logger.error({ error: e }, 'Unknown error during migration execution:');
    }
    throw e;
  }
};
