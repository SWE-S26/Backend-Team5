import { ITrack } from '../../../shared/models/models.track';
import {
  TrackResponsePrivateDTO,
  TrackResponsePrivateDTOV2,
  TrackResponsePublic,
  TrackResponsePublicDTO,
} from './tracks.response';
import {
  CreateTrackDTO,
  CreateTrackDTOV2,
  TrackInputV2,
} from './tracks.request.body';
import { PublitioUploadResult } from '../../../shared/abstractions/publitio.service';
import { TrackInput } from './tracks.request.body';
import { Types } from 'mongoose';
import { IAdvancedAudioDetails } from '../../../shared/models/models.advanced-audio-details';
import { TrackDetailedInfo, TrackDetailedInfoV2 } from './tracks.response';
import { Region, Country, RegionCountries } from '../tracks.consts';

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

  static toTrackInputV2(
    track: CreateTrackDTOV2,
    audioInfo: PublitioUploadResult,
    imgInfo: ImageInfo | null,
    posterId: Types.ObjectId,
    duration: number,
    waveformLink: string,
  ): TrackInputV2 {
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
        geoBlocking: track.geoBlocking,
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
        caption: trackBasicInfo.caption,
      },
      posterId: track.posterId.toString(),
      durationInSeconds: track.durationInSeconds,
      audio: track.audio,
      image: track.image,
      numLikes: track.numOfLikes,
      numPlays: track.numOfPlays,
      numReposts: track.numberOfReposts,
      numComments: track.comments.length,
      releaseDate: track.createdAt,
      isLikedByUser: track.likedBy.map((id) => id.toString()).includes(userId),
      permissions: track.permissions,
      license: track.license,
      audioClip: {
        start: track.audioClip?.start ?? 0,
        end: track.audioClip?.end ?? 0,
      },
    };
  }

  static toTrackResponsePrivateV2(
    track: ITrack,
    userId: string,
    userCountry: string,
    repostedList: string[],
  ): TrackResponsePrivateDTOV2 {
    const trackBasicInfo = track.basicInfo;
    const mode = track.geoBlocking.mode;
    const countries = track.geoBlocking.countries;
    const regions = track.geoBlocking.regions;
    const isInList =
      countries.includes(userCountry as Country) ||
      regions.some((region) =>
        RegionCountries[region as Region].includes(userCountry as Country),
      );

    let isAvailableForUser = false;

    if (!userCountry) {
      isAvailableForUser = mode === 'worldwide';
    } else {
      switch (mode) {
        case 'exclusive':
          isAvailableForUser = isInList;
          break;

        case 'blocked':
          isAvailableForUser = !isInList;
          break;

        case 'worldwide':
          isAvailableForUser = true;
          break;
      }
    }
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
        caption: trackBasicInfo.caption,
      },
      posterId: track.posterId.toString(),
      durationInSeconds: track.durationInSeconds,
      audio: track.audio,
      image: track.image,
      numLikes: track.numOfLikes,
      numPlays: track.numOfPlays,
      numReposts: track.numberOfReposts,
      numComments: track.comments.length,
      releaseDate: track.createdAt,
      isLikedByUser: track.likedBy.map((id) => id.toString()).includes(userId),
      isRepostedByUser: repostedList.includes(track._id.toString()),
      isAvailableForUser: isAvailableForUser,
      permissions: track.permissions,
      license: track.license,
      geoBlocking: {
        mode: track.geoBlocking.mode,
        regions: track.geoBlocking.regions as Region[],
        countries: track.geoBlocking.countries as Country[],
      },
      audioClip: {
        start: track.audioClip?.start ?? 0,
        end: track.audioClip?.end ?? 0,
      },
    };
  }

  static toTrackResponsePublic(track: ITrack): TrackResponsePublicDTO {
    const trackBasicInfo = track.basicInfo;
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
        caption: trackBasicInfo.caption,
      },
      posterId: track.posterId.toString(),
      durationInSeconds: track.durationInSeconds,
      audio: track.audio,
      image: track.image,
      numLikes: track.numOfLikes,
      numPlays: track.numOfPlays,
      numReposts: track.numberOfReposts,
      numComments: track.comments.length,
      releaseDate: track.createdAt,
      permissions: track.permissions,
      license: track.license,
      audioClip: {
        start: track.audioClip?.start ?? 0,
        end: track.audioClip?.end ?? 0,
      },
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

  static toTrackResponsePrivateListV2(
    tracks: ITrack[],
    userId: string,
    userCountry: string,
    repostedList: string[],
  ): TrackResponsePrivateDTOV2[] {
    const tracksMapped: TrackResponsePrivateDTOV2[] = [];
    tracks.forEach((track) => {
      const trackMapped = this.toTrackResponsePrivateV2(
        track,
        userId,
        userCountry,
        repostedList,
      );
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

  static toTrackDetailedResponseV2(
    track: ITrack,
    advanced: IAdvancedAudioDetails,
  ): TrackDetailedInfoV2 {
    return {
      id: track._id.toString(),
      basicInfo: track.basicInfo,
      permissions: track.permissions,
      license: track.license,
      geoBlocking: {
        mode: track.geoBlocking.mode,
        regions: track.geoBlocking.regions as Region[],
        countries: track.geoBlocking.countries as Country[],
      },
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
