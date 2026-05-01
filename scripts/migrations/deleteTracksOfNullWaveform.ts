import logger from '../../src/shared/logger/logger';
import 'dotenv/config';
import Track from '../../src/shared/models/models.track';
import publitioMediaStorage from '../../src/shared/abstractions/publitio.service';
import blobStorageService from '../../src/shared/abstractions/blob.service';

export const deleteTrackOfNullWaveform = async (): Promise<void> => {
  const tracks = await Track.find({
    'basicInfo.title': 'Should Generate Waveform blob storage',
  });

  for (const track of tracks) {
    publitioMediaStorage.deleteAudioTrack(track.audio.id, 0);
    if (track.audio.waveformLink) {
      await blobStorageService.deleteWaveFromBlob(track._id);
    }
    await Track.deleteOne({ _id: track._id });
  }

  logger.info(`Deleted ${tracks.length} Tracks with Null waveform`);
};
