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
import { CreateTrackDTO, UpdateTrackDTO } from './dtos/tracks.request.body';
import publitioMediaStorage from '../../shared/abstractions/publitio';
import {
  CloudinaryService,
  ImageFolder,
} from '../../shared/abstractions/cloudinary.service';
import { IAdvancedAudioDetails } from '../../shared/models/models.advanced-audio-details';

type ImageInfo = {
  imgLink: string;
  publicId: string;
};

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

  async getTrackById(trackId: string): Promise<TrackResponseDTO | null> {
    const searchTrack = await this.tracksRepository.findById(trackId);

    // if not found
    if (!searchTrack) {
      throw NotFoundError("Track Doesn't Exists");
    }

    return TracksMapper.toTrackResponse(searchTrack);
  }

  async incrementTrackNumPlays(trackId: string): Promise<Boolean> {
    const searchTrack = await this.tracksRepository.findById(trackId);

    if (!searchTrack) {
      throw NotFoundError("Track Doesn't Exists");
    }
    return await this.tracksRepository.incrementNumPlays(trackId);
  }

  async getLikedTracks(userId: string): Promise<TrackResponseDTO[] | null> {
    const likedTracksList = await this.tracksRepository.getLikedTracks(userId);

    // no liked tracks for this user
    if (!likedTracksList) {
      return null;
    }

    const trackResponseList: TrackResponseDTO[] =
      TracksMapper.toTrackResponseList(likedTracksList as ITrack[]);
    return trackResponseList;
  }

  async uploadAudioTrack(
    trackInfo: CreateTrackDTO,
    audio: Express.Multer.File,
    image: Express.Multer.File | null,
    posterId: string,
  ): Promise<Boolean> {
    const audioInfo = await this.trackUploader.uploadAudioTrack(audio);
    let imgInfo: ImageInfo | null = null;
    if (image) {
      const retreiveImgInfo = await this.imgUploader.uploadImage(
        image.buffer,
        ImageFolder.AUDIO,
      );
      imgInfo = {
        imgLink: retreiveImgInfo?.url as string,
        publicId: retreiveImgInfo?.publicId,
      };
    }

    const trackInput = TracksMapper.toTrackInput(
      trackInfo,
      audioInfo,
      imgInfo,
      new Types.ObjectId(posterId),
    );

    return await this.tracksRepository.createNewTrack(trackInput);
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

  async updateTrackInfo(
    trackInfo: UpdateTrackDTO,
    userId: string,
    userRole: string,
    image: Express.Multer.File | null,
  ) {
    const searchTrack = await this.tracksRepository.findById(trackInfo.id);

    // TODO: REFACTOR THIS PART : MAKE IT DRY
    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }

    let imgInfo: ImageInfo | null = null;
    if (image) {
      const retreiveImgInfo = await this.imgUploader.uploadImage(
        image.buffer,
        ImageFolder.AUDIO,
      );
      imgInfo = {
        imgLink: retreiveImgInfo?.url as string,
        publicId: retreiveImgInfo?.publicId,
      };
    }

    const posterId = searchTrack.posterId.toString();

    // if the user trying to delete is not
    if (userRole !== 'Admin') {
      if (userId !== posterId) {
        // means user is trying to delete a track he has not posted
        throw UnauthorizedError('Unauthorized Action');
      }
    }
    const updatedTrack = await this.tracksRepository.updateTrackInfo(
      trackInfo,
      imgInfo,
    );
    return TracksMapper.toTrackResponse(updatedTrack);
  }

  async getUserPostedTracks(userId: string) {
    const postedTracks = await this.tracksRepository.getPostedTracks(userId);
    return TracksMapper.toTrackResponseList(postedTracks);
  }

  async addToUserHistory(userId: string, trackId: string) {
    const searchTrack = await this.tracksRepository.findById(trackId);

    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }

    await this.tracksRepository.addToHistory(userId, trackId);
    return true;
  }

  async getTrackDetailedInfo(
    userId: string,
    trackId: string,
    userRole: string,
  ) {
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

    const searchAdvancedInfo =
      await this.tracksRepository.getTrackAdvancedInfo(trackId);
    return TracksMapper.toTrackDetailedResponse(
      searchTrack,
      searchAdvancedInfo as IAdvancedAudioDetails,
    );
  }
}
