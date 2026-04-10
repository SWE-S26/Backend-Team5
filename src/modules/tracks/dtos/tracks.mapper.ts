import { ITrack } from '../../../shared/models/models.track';
import { TrackResponseDTO } from './tracks.response';
import { CreateTrackDTO } from './tracks.request.body';
import { PublitioUploadResult } from '../../../shared/abstractions/publitio';
import { CloudinaryUploadResult } from '../../../shared/abstractions/cloudinary.service';
import { TrackInput } from './tracks.request.body';
import { Types } from 'mongoose';

type ImageInfo = {
  imgLink: string;
  publicId: string;
};

export class TracksMapper {
  static toTrackInput(
    track: CreateTrackDTO,
    audioInfo: PublitioUploadResult,
    imgInfo: ImageInfo | null,
    posterId: Types.ObjectId,
  ): TrackInput {
    return {
      trackInfo: {
        basicInfo: track.basicInfo,
        audio: audioInfo,
        ...(imgInfo && { image: imgInfo }),
        posterId: posterId,
        numOfPlays: 0,
        numberOfReposts: 0,
        numOfLikes: 0,
        likedBy: [] as Types.ObjectId[],
        comments: [] as Types.ObjectId[],
        permissions: track.permissions,
        license: track.license,
      },
      advanced: track.advanced,
    };
  }

  static toTrackResponse(track: ITrack): TrackResponseDTO {
    const trackBasicInfo = track.basicInfo;
    return {
      _id: track._id.toString(),
      basicInfo: {
        title: trackBasicInfo.title,
        permalink: trackBasicInfo.permalink,
        mainArtists: trackBasicInfo.mainArtists,
        genre: trackBasicInfo.genre,
        tags: trackBasicInfo.tags,
        description: trackBasicInfo.description,
        isPrivate: trackBasicInfo.isPrivate,
      },
      audio: track.audio,
      image: track.image,
      numLikes: track.numOfLikes,
      numPlays: track.numOfPlays,
      numReposts: track.numberOfReposts,
      numComments: track.comments.length,
      releaseDate: track.createdAt,
    };
  }

  static toTrackResponseList(tracks: ITrack[]): TrackResponseDTO[] {
    const tracksMapped: TrackResponseDTO[] = [];
    tracks.forEach((track) => {
      const trackMapped = this.toTrackResponse(track);
      tracksMapped.push(trackMapped);
    });
    return tracksMapped;
  }
}
