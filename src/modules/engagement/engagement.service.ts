import { Types } from 'mongoose';
import { NotFoundError } from '../../shared/errors/responseErrors';
import { EngagementRepository } from './engagement.repository';
import { EngagementMapper } from './dtos/engagement.mapper';
import {
  ToggleLikeResponse,
  TogglePlaylistLikeResponse,
} from './dtos/engagement.response';

export class EngagementService {
  constructor(private readonly repository: EngagementRepository) {}

  async toggleTrackLike(
    trackId: string,
    userId: string,
  ): Promise<ToggleLikeResponse> {
    const track = await this.repository.findTrackById(trackId);

    if (!track) NotFoundError('Track not found');

    const userObjectId = new Types.ObjectId(userId);
    const alreadyLiked = track!.likedBy.some((id) => id.equals(userObjectId));

    if (alreadyLiked) {
      const [updated] = await Promise.all([
        this.repository.removeLikeFromTrack(trackId, userId),
        this.repository.removeTrackFromUserLikes(userId, trackId),
      ]);
      return EngagementMapper.toTrackLikeResponse(updated, false);
    }

    const [updated] = await Promise.all([
      this.repository.addLikeToTrack(trackId, userId),
      this.repository.addTrackToUserLikes(userId, trackId),
    ]);
    return EngagementMapper.toTrackLikeResponse(updated, true);
  }

  async togglePlaylistLike(
    playlistId: string,
    userId: string,
  ): Promise<TogglePlaylistLikeResponse> {
    const playlist = await this.repository.findPlaylistById(playlistId);

    if (!playlist) NotFoundError('Playlist not found');

    const userObjectId = new Types.ObjectId(userId);
    const alreadyLiked = playlist!.likedUser.some((id) =>
      id.equals(userObjectId),
    );

    if (alreadyLiked) {
      const [updated] = await Promise.all([
        this.repository.removeLikeFromPlaylist(playlistId, userId),
        this.repository.removePlaylistFromUserLikes(userId, playlistId),
      ]);
      return EngagementMapper.toPlaylistLikeResponse(updated, false);
    }

    const [updated] = await Promise.all([
      this.repository.addLikeToPlaylist(playlistId, userId),
      this.repository.addPlaylistToUserLikes(userId, playlistId),
    ]);
    return EngagementMapper.toPlaylistLikeResponse(updated, true);
  }
}
