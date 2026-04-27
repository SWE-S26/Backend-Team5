import { ITrack } from '../../../shared/models/models.track';
import {
  TrackResponsePrivateDTO,
  TrackResponsePublic,
  TrackResponsePublicDTO,
} from './tracks.response';
import { CreateTrackDTO } from './tracks.request.body';
import { PublitioUploadResult } from '../../../shared/abstractions/publitio';
import { TrackInput } from './tracks.request.body';
import { Types } from 'mongoose';
import { IAdvancedAudioDetails } from '../../../shared/models/models.advanced-audio-details';
import { TrackDetailedInfo } from './tracks.response';

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
    duration: number,
    waveformLink: string,
  ): TrackInput {
    return {
      trackInfo: {
        basicInfo: track.basicInfo,
        audio: {
          waveformLink: waveformLink,
          ...audioInfo,
        },
        ...(imgInfo && { image: imgInfo }),
        posterId: posterId,
        numOfPlays: 0,
        numberOfReposts: 0,
        numOfLikes: 0,
        durationInSeconds: duration,
        likedBy: [] as Types.ObjectId[],
        comments: [] as Types.ObjectId[],
        permissions: track.permissions,
        license: track.license,
        composer: track.advanced.composer ?? '',
        audioClip: {
          start: track.advanced.audioClipStart ?? 0,
          end: track.advanced.audioClipEnd ?? 0,
        },
        releaseTitle: track.advanced.releaseTitle ?? '',
        hidden: false,
      },
      advanced: {
        buyLink: track.advanced.buyLink ?? '',
        recordLabel: track.advanced.recordLabel ?? '',
        releaseDate: track.advanced.releaseDate ?? '',
        publisher: track.advanced.publisher ?? '',
        isrc: track.advanced.ISRC ?? '',
        iswc: track.advanced.ISWC ?? '',
        explicitContent: track.advanced.explicitContent,
        pLine: track.advanced.pLine ?? '',
        albumTitle: track.advanced.albumTitle ?? '',
      },
    };
  }

  static toTrackResponsePrivate(
    track: ITrack,
    userId: string,
  ): TrackResponsePrivateDTO {
    const trackBasicInfo = track.basicInfo;
    const audio = track.audio as unknown as { id: string; url?: string; audioLink?: string };
    const image = track.image as unknown as {
      publicId: string;
      url?: string;
      imgLink?: string;
    };

    return {
      trackId: track._id.toString(),
      basicInfo: {
        title: trackBasicInfo.title,
        permalink: trackBasicInfo.permalink,
        mainArtists: trackBasicInfo.mainArtists,
        genre: trackBasicInfo.genre,
        tags: trackBasicInfo.tags,
        description: trackBasicInfo.description,
        isPrivate: trackBasicInfo.isPrivate,
      },
      posterId: track.posterId.toString(),
      durationInSeconds: track.durationInSeconds,
      audio: {
        id: audio.id,
        url: audio.url ?? audio.audioLink ?? '',
      },
      image: {
        publicId: image.publicId,
        url: image.url ?? image.imgLink ?? '',
      },
      numLikes: track.numOfLikes,
      numPlays: track.numOfPlays,
      numReposts: track.numberOfReposts,
      numComments: track.comments.length,
      releaseDate: track.createdAt,
      isLikedByUser: track.likedBy.map((id) => id.toString()).includes(userId),
    };
  }

  static toTrackResponsePublic(track: ITrack): TrackResponsePublicDTO {
    const trackBasicInfo = track.basicInfo;
    const audio = track.audio as unknown as { id: string; url?: string; audioLink?: string };
    const image = track.image as unknown as {
      publicId: string;
      url?: string;
      imgLink?: string;
    };

    return {
      trackId: track._id.toString(),
      basicInfo: {
        title: trackBasicInfo.title,
        permalink: trackBasicInfo.permalink,
        mainArtists: trackBasicInfo.mainArtists,
        genre: trackBasicInfo.genre,
        tags: trackBasicInfo.tags,
        description: trackBasicInfo.description,
        isPrivate: trackBasicInfo.isPrivate,
      },
      posterId: track.posterId.toString(),
      durationInSeconds: track.durationInSeconds,
      audio: {
        id: audio.id,
        url: audio.url ?? audio.audioLink ?? '',
      },
      image: {
        publicId: image.publicId,
        url: image.url ?? image.imgLink ?? '',
      },
      numLikes: track.numOfLikes,
      numPlays: track.numOfPlays,
      numReposts: track.numberOfReposts,
      numComments: track.comments.length,
      releaseDate: track.createdAt,
    };
  }

  static toTrackResponsePublicList(tracks: ITrack[]): TrackResponsePublicDTO[] {
    const tracksMapped: TrackResponsePublicDTO[] = [];
    tracks.forEach((track) => {
      const trackMapped = this.toTrackResponsePublic(track);
      tracksMapped.push(trackMapped);
    });
    return tracksMapped;
  }

  static toTrackResponsePrivateList(
    tracks: ITrack[],
    userId: string,
  ): TrackResponsePrivateDTO[] {
    const tracksMapped: TrackResponsePrivateDTO[] = [];
    tracks.forEach((track) => {
      const trackMapped = this.toTrackResponsePrivate(track, userId);
      tracksMapped.push(trackMapped);
    });
    return tracksMapped;
  }

  static toTrackDetailedResponse(
    track: ITrack,
    advanced: IAdvancedAudioDetails,
  ): TrackDetailedInfo {
    return {
      id: track._id.toString(),
      basicInfo: track.basicInfo,
      permissions: track.permissions,
      license: track.license,
      advanced: {
        buyLink: advanced.buyLink,
        recordLabel: advanced.recordLabel,
        releaseDate: advanced.releaseDate
          ? advanced.releaseDate.toISOString()
          : undefined,
        publisher: advanced.publisher,
        ISRC: advanced.isrc,
        explicitContent: advanced.explicitContent,
        pLine: advanced.pLine,
        audioClipStart: track.audioClip?.start,
        audioClipEnd: track.audioClip?.end,
        composer: track.composer,
        ISWC: advanced.iswc,
        albumTitle: advanced.albumTitle,
      },
    };
  }
}
