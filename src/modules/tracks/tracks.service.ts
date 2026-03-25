import {
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors/responseErrors';
import { TracksRepository } from './tracks.repository';
import { Types } from 'mongoose';
import { TracksMapper } from './dtos/tracks.mapper';
import { TrackResponseDTO } from './dtos/tracks.response';
import { ITrack } from '../../shared/models/models.track';

export class TracksService {
  private readonly tracksRepository: TracksRepository;

  constructor() {
    this.tracksRepository = new TracksRepository();
  }

  async deleteTrackById(
    userId: string,
    trackId: string,
    userRole: string,
  ): Promise<Boolean> {
    const searchTrack = await this.tracksRepository.findById(trackId);

    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }

    const posterId = searchTrack.posterId.toString();

    // if the user trying to delete is not
    if (userRole !== 'Admin') {
      if (userId !== posterId) {
        // means user is trying to delete a track he has not posted
        throw UnauthorizedError('Unauthorized Action');
      }
    }

    const isDeleted = await this.tracksRepository.deleteById(trackId);
    return isDeleted;
  }

  async getTrackById(
    trackId: string,
    userId: string,
  ): Promise<TrackResponseDTO | null> {
    const searchTrack = await this.tracksRepository.findById(trackId);

    // if not found
    if (!searchTrack) {
      throw NotFoundError("Track Doesn't Exists");
    }

    const posterId = (searchTrack.posterId._id as Types.ObjectId).toString();

    // track is private and the user searching for him isnt the owner
    if (searchTrack.basicInfo.isPrivate && posterId != userId) {
      throw NotFoundError("Track Doesn't Exists");
    }

    return TracksMapper.toTrackResponse(searchTrack);
  }

  async incrementTrackNumPlays(trackId: string): Promise<Boolean> {
    const searchTrack = await this.tracksRepository.findById(trackId);

    if (!searchTrack) {
      throw NotFoundError("Track Doesn't Exists");
    }

    const newNumPlays = searchTrack.numOfPlays + 1;
    return await this.tracksRepository.incrementNumPlays(trackId, newNumPlays);
  }

  async getLikedTracks(userId: string): Promise<TrackResponseDTO[] | null> {
    const likedTracksList = await this.tracksRepository.getLikedTracks(userId);

    // no liked tracks for this user
    if (!likedTracksList) {
      return null;
    }

    const trackResponseList: TrackResponseDTO[] = [];

    likedTracksList.forEach((track) => {
      const trackResponse = TracksMapper.toTrackResponse(track as ITrack);
      trackResponseList.push(trackResponse);
    });

    return trackResponseList;
  }

  async uploadAudioTrack() {}

  async update(id: string, data: any): Promise<any | null> {
    return this.tracksRepository.update(id, data);
  }
}
