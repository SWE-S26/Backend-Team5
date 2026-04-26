import Playlist from '../../src/shared/models/models.playlist';
import Track from '../../src/shared/models/models.track';
import logger from '../../src/shared/logger/logger';

export const cleanUpPlaylistsWithNoTracks = async () => {
  const playlistsWithNoTracks = await Playlist.find({
    listOfTracks: { $size: 0 },
  })
    .select('_id')
    .lean();

  const playlists = await Playlist.deleteMany({
    _id: { $in: playlistsWithNoTracks.map((playlist) => playlist._id) },
  });

  logger.info(`Cleaned up ${playlists.deletedCount} playlists with no tracks.`);

  const validTracks = await Track.find().select('_id').lean();
  const validTrackIds = new Set(validTracks.map((t) => t._id.toString()));

  const updatedPlaylists = await Playlist.updateMany(
    {},
    {
      $pull: {
        listOfTracks: { $nin: Array.from(validTrackIds) },
      },
    },
  );

  logger.info(
    `Cleaned up ${updatedPlaylists.modifiedCount} playlists by removing deleted tracks from their listOfTracks.`,
  );
};
