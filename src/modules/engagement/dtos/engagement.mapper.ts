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
  ToggleRepostResponse,
  ToggleRepostResponseDTO,
  TogglePlaylistRepostResponse,
  TogglePlaylistRepostResponseDTO,
  TrackRepostStatusResponse,
  TrackRepostStatusResponseDTO,
  PlaylistRepostStatusResponse,
  PlaylistRepostStatusResponseDTO,
  UpdateRepostCaptionResponse,
  UpdateRepostCaptionResponseDTO,
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

  static toTrackRepostResponse(
    track: ITrack,
    reposted: boolean,
  ): ToggleRepostResponse {
    return ToggleRepostResponseDTO.parse({
      reposted,
      numberOfReposts: track.numberOfReposts,
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

  static toTrackRepostStatusResponse(
    repost: IUser['reposts'][number] | null,
  ): TrackRepostStatusResponse {
    if (!repost) {
      return TrackRepostStatusResponseDTO.parse({
        reposted: false,
      });
    }

    return TrackRepostStatusResponseDTO.parse({
      reposted: true,
      caption: repost.caption || undefined,
      repostedAt: repost.timestamp?.toISOString(),
    });
  }

  static toUpdateRepostCaptionResponse(
    caption: string,
  ): UpdateRepostCaptionResponse {
    return UpdateRepostCaptionResponseDTO.parse({
      success: true,
      caption,
    });
  }

  static toPlaylistRepostResponse(
    playlist: IPlaylist,
    reposted: boolean,
  ): TogglePlaylistRepostResponse {
    return TogglePlaylistRepostResponseDTO.parse({
      reposted,
      numberOfReposts: playlist.numOfReposts,
    });
  }

  static toPlaylistRepostStatusResponse(
    repost: IUser['reposts'][number] | null,
  ): PlaylistRepostStatusResponse {
    if (!repost) {
      return PlaylistRepostStatusResponseDTO.parse({
        reposted: false,
      });
    }

    return PlaylistRepostStatusResponseDTO.parse({
      reposted: true,
      caption: repost.caption || undefined,
      repostedAt: repost.timestamp?.toISOString(),
    });
  }
}
