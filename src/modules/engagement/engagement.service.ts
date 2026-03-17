import { Types } from 'mongoose';
import { NotFoundError } from '../../shared/errors/responseErrors';
import { EngagementRepository } from './engagement.repository';
import { EngagementMapper } from './dtos/engagement.mapper';
import {
  TrackLikersResponse,
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

  async getTrackLikers(
    trackId: string,
    page = '1',
    limit = '20',
  ): Promise<TrackLikersResponse> {
    const track = await this.repository.findTrackById(trackId);

    if (!track) NotFoundError('Track not found');

    const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
    const skip = (parsedPage - 1) * parsedLimit;
    const total = track!.likedBy.length;
    const pagedUserIds = track!.likedBy.slice(skip, skip + parsedLimit);

    const [users, followersCountByUserId] = await Promise.all([
      this.repository.findTrackLikers(pagedUserIds),
      this.repository.findFollowersCountByUserIds(pagedUserIds),
    ]);

    const usersById = new Map(users.map((user) => [user._id.toString(), user]));
    const orderedUsers = pagedUserIds
      .map((id) => usersById.get(id.toString()))
      .filter((user): user is (typeof users)[number] => Boolean(user));

    return EngagementMapper.toTrackLikersResponse(
      orderedUsers,
      followersCountByUserId,
      total,
      parsedPage,
      parsedLimit,
    );
  }

  async getPlaylistLikers(
    playlistId: string,
    page = '1',
    limit = '20',
  ): Promise<TrackLikersResponse> {
    const playlist = await this.repository.findPlaylistById(playlistId);

    if (!playlist) NotFoundError('Playlist not found');

    const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
    const skip = (parsedPage - 1) * parsedLimit;
    const total = playlist!.likedUser.length;
    const pagedUserIds = playlist!.likedUser.slice(skip, skip + parsedLimit);

    const [users, followersCountByUserId] = await Promise.all([
      this.repository.findTrackLikers(pagedUserIds),
      this.repository.findFollowersCountByUserIds(pagedUserIds),
    ]);

    const usersById = new Map(users.map((user) => [user._id.toString(), user]));
    const orderedUsers = pagedUserIds
      .map((id) => usersById.get(id.toString()))
      .filter((user): user is (typeof users)[number] => Boolean(user));

    return EngagementMapper.toTrackLikersResponse(
      orderedUsers,
      followersCountByUserId,
      total,
      parsedPage,
      parsedLimit,
    );
  }
}
