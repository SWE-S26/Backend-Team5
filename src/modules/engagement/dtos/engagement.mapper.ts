import { IPlaylist } from '../../../shared/models/models.playlist';
import { ITrack } from '../../../shared/models/models.track';
import { IUser } from '../../../shared/models/models.user';
import {
  TrackLikersResponse,
  TrackLikersResponseDTO,
  ToggleLikeResponse,
  ToggleLikeResponseDTO,
  TogglePlaylistLikeResponse,
  TogglePlaylistLikeResponseDTO,
} from './engagement.response';

export class EngagementMapper {
  static toTrackLikeResponse(
    track: ITrack,
    liked: boolean,
  ): ToggleLikeResponse {
    return ToggleLikeResponseDTO.parse({
      liked,
      numOfLikes: track.numOfLikes,
    });
  }

  static toPlaylistLikeResponse(
    playlist: IPlaylist,
    liked: boolean,
  ): TogglePlaylistLikeResponse {
    return TogglePlaylistLikeResponseDTO.parse({
      liked,
      numOfLikes: playlist.numOfLikes,
    });
  }

  static toTrackLikersResponse(
    users: Pick<IUser, '_id' | 'displayName' | 'profileImg'>[],
    followersCountByUserId: Record<string, number>,
    total: number,
    offset: number,
    limit: number,
  ): TrackLikersResponse {
    return TrackLikersResponseDTO.parse({
      total,
      offset,
      limit,
      users: users.map((user) => ({
        userId: user._id.toString(),
        displayName: user.displayName,
        avatarUrl: user.profileImg?.imgLink || undefined,
        followersCount: followersCountByUserId[user._id.toString()] ?? 0,
      })),
    });
  }
}
