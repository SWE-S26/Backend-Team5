import logger from '../../src/shared/logger/logger';
import 'dotenv/config';
import Track from '../../src/shared/models/models.track';
import Playlist from '../../src/shared/models/models.playlist';
import publitioMediaStorage from '../../src/shared/abstractions/publitio.service';
import blobStorageService from '../../src/shared/abstractions/blob.service';
import { Types } from 'mongoose';

export const deletePlaylistsWithInvalidTracks = async (): Promise<void> => {
  const playlists = await Playlist.find({});
  let deletedCount = 0;

  for (const playlist of playlists) {
    const validTrackIds: Types.ObjectId[] = [];

    for (const trackId of playlist.listOfTracks) {
      const exists = await Track.exists({ _id: trackId });
      if (exists) {
        validTrackIds.push(trackId);
      }
    }

    if (validTrackIds.length !== playlist.listOfTracks.length) {
      await Playlist.findByIdAndUpdate(playlist._id, {
        $set: { listOfTracks: validTrackIds },
      });
      deletedCount += playlist.listOfTracks.length - validTrackIds.length;
    }
  }

  logger.info(
    `Removed ${deletedCount} invalid track references from playlists`,
  );
};
