import {
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors/responseErrors';
import { TracksRepository } from './tracks.repository';
import { Types } from 'mongoose';
import { TracksMapper } from './dtos/tracks.mapper';
import {
  TrackResponseDTO,
  PaginationResponseDTO,
} from './dtos/tracks.response';
import { ITrack } from '../../shared/models/models.track';
import { CreateTrackDTO } from './dtos/tracks.request.body';
import publitioMediaStorage from '../../shared/abstractions/publitio';
import { CloudinaryService } from '../../shared/abstractions/cloudinary.service';

export class TracksService {
  private readonly tracksRepository: TracksRepository;
  private readonly trackUploader;
  private readonly imgUploader;

  constructor() {
    this.tracksRepository = new TracksRepository();
    this.trackUploader = publitioMediaStorage;
    this.imgUploader = CloudinaryService;
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

    // delete audio from cloud storage first
    publitioMediaStorage.deleteAudioTrack(searchTrack.audio.id);

    // delete track info from database
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

  async uploadAudioTrack(
    trackInfo: CreateTrackDTO,
    audio: Express.Multer.File,
    image: Express.Multer.File | null,
  ): Promise<Boolean> {
    const audioInfo = await this.trackUploader.uploadAudioTrack(audio);
    const imgInfo = null;
    if (image) {
      // this.imgUploader.uploadImage(image)
    }

    return await this.tracksRepository.createNewTrack(
      trackInfo,
      audioInfo,
      imgInfo,
    );
  }

  async getTrackByPermalink(permalink: string) {
    const searchTrack =
      await this.tracksRepository.getTrackByPermalink(permalink);
    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }
    return TracksMapper.toTrackResponse(searchTrack);
  }

  async getPaginatedList(
    page: number,
    limit: number,
  ): Promise<PaginationResponseDTO> {
    const { tracks, info } = await this.tracksRepository.getPaginatedList(
      page,
      limit,
    );
    const tracksMapped = TracksMapper.toTrackResponseList(tracks);
    return {
      tracks: tracksMapped,
      paginationInfo: {
        ...info,
      },
    };
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.tracksRepository.update(id, data);
  }
}
