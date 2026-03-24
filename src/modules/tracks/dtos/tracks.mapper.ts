import { ITrack } from '../../../shared/models/models.track';
import { TrackResponseDTO } from './tracks.response';

export class TracksMapper {
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
      audioUrl: track.audioUrl,
      imageUrl: track.audioUrl,
      numLikes: track.numOfLikes,
      numPlays: track.numOfPlays,
      numReposts: track.numberOfReposts,
      releaseDate: track.createdAt,
    };
  }
}
