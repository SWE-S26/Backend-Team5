import { IPlaylist } from '../../../shared/models/models.playlist';
import { ITrack } from '../../../shared/models/models.track';
import {
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
}
