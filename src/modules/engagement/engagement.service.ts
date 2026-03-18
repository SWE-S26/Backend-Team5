import { Types } from 'mongoose';
import {
  BadRequestError,
  NotFoundError,
} from '../../shared/errors/responseErrors';
import { EngagementRepository } from './engagement.repository';
import { EngagementMapper } from './dtos/engagement.mapper';
import {
  TrackLikersResponse,
  ToggleLikeResponse,
  TogglePlaylistLikeResponse,
  ToggleRepostResponse,
  TogglePlaylistRepostResponse,
  TrackRepostStatusResponse,
  PlaylistRepostStatusResponse,
  UpdateRepostCaptionResponse,
} from './dtos/engagement.response';

// TODO: notifications will be added later after the notification module is made

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

  async toggleTrackRepost(
    trackId: string,
    userId: string,
    caption?: string,
  ): Promise<ToggleRepostResponse> {
    const track = await this.repository.findTrackById(trackId);

    if (!track) NotFoundError('Track not found');

    const userReposts = await this.repository.findUserReposts(userId);
    const alreadyReposted = userReposts?.some(
      (repost) => repost.id === trackId && repost.type === 'track',
    );

    if (alreadyReposted) {
      const [updated] = await Promise.all([
        this.repository.removeRepostFromTrack(trackId),
        this.repository.removeRepostFromUser(userId, trackId),
      ]);
      return EngagementMapper.toTrackRepostResponse(updated, false);
    }

    const [updated] = await Promise.all([
      this.repository.addRepostToTrack(trackId),
      this.repository.addRepostToUser(userId, trackId, caption),
    ]);
    return EngagementMapper.toTrackRepostResponse(updated, true);
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

  async getTrackRepostStatus(
    trackId: string,
    userId: string,
  ): Promise<TrackRepostStatusResponse> {
    const track = await this.repository.findTrackById(trackId);

    if (!track) NotFoundError('Track not found');

    const repost = await this.repository.findUserTrackRepost(userId, trackId);

    return EngagementMapper.toTrackRepostStatusResponse(repost);
  }

  async updateTrackRepostCaption(
    trackId: string,
    userId: string,
    caption: string,
  ): Promise<UpdateRepostCaptionResponse> {
    const track = await this.repository.findTrackById(trackId);

    if (!track) NotFoundError('Track not found');

    const repost = await this.repository.findUserTrackRepost(userId, trackId);

    if (!repost) BadRequestError('You have not reposted this track');

    await this.repository.updateRepostCaption(userId, trackId, caption);

    return EngagementMapper.toUpdateRepostCaptionResponse(caption);
  }

  async togglePlaylistRepost(
    playlistId: string,
    userId: string,
    caption?: string,
  ): Promise<TogglePlaylistRepostResponse> {
    const playlist = await this.repository.findPlaylistById(playlistId);

    if (!playlist) NotFoundError('Playlist not found');

    const userReposts = await this.repository.findUserReposts(userId);
    const alreadyReposted = userReposts?.some(
      (repost) => repost.id === playlistId && repost.type === 'playlist',
    );

    if (alreadyReposted) {
      const [updated] = await Promise.all([
        this.repository.removeRepostFromPlaylist(playlistId),
        this.repository.removePlaylistRepostFromUser(userId, playlistId),
      ]);
      return EngagementMapper.toPlaylistRepostResponse(updated, false);
    }

    const [updated] = await Promise.all([
      this.repository.addRepostToPlaylist(playlistId),
      this.repository.addPlaylistRepostToUser(userId, playlistId, caption),
    ]);
    return EngagementMapper.toPlaylistRepostResponse(updated, true);
  }

  async getPlaylistRepostStatus(
    playlistId: string,
    userId: string,
  ): Promise<PlaylistRepostStatusResponse> {
    const playlist = await this.repository.findPlaylistById(playlistId);

    if (!playlist) NotFoundError('Playlist not found');

    const repost = await this.repository.findUserPlaylistRepost(
      userId,
      playlistId,
    );

    return EngagementMapper.toPlaylistRepostStatusResponse(repost);
  }

  async updatePlaylistRepostCaption(
    playlistId: string,
    userId: string,
    caption: string,
  ): Promise<UpdateRepostCaptionResponse> {
    const playlist = await this.repository.findPlaylistById(playlistId);

    if (!playlist) NotFoundError('Playlist not found');

    const repost = await this.repository.findUserPlaylistRepost(
      userId,
      playlistId,
    );

    if (!repost) BadRequestError('You have not reposted this playlist');

    await this.repository.updatePlaylistRepostCaption(
      userId,
      playlistId,
      caption,
    );

    return EngagementMapper.toUpdateRepostCaptionResponse(caption);
  }

  async getTrackReposters(
    trackId: string,
    page = '1',
    limit = '20',
  ): Promise<TrackLikersResponse> {
    const track = await this.repository.findTrackById(trackId);

    if (!track) NotFoundError('Track not found');

    const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Number.parseInt(limit, 10) || 20);

    const { users, total } = await this.repository.findTrackReposters(
      trackId,
      parsedPage,
      parsedLimit,
    );

    const userIds = users.map((user) => user._id);
    const followersCountByUserId =
      await this.repository.findFollowersCountByUserIds(userIds);

    return EngagementMapper.toTrackLikersResponse(
      users,
      followersCountByUserId,
      total,
      parsedPage,
      parsedLimit,
    );
  }

  async getPlaylistReposters(
    playlistId: string,
    page = '1',
    limit = '20',
  ): Promise<TrackLikersResponse> {
    const playlist = await this.repository.findPlaylistById(playlistId);

    if (!playlist) NotFoundError('Playlist not found');

    const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Number.parseInt(limit, 10) || 20);

    const { users, total } = await this.repository.findPlaylistReposters(
      playlistId,
      parsedPage,
      parsedLimit,
    );

    const userIds = users.map((user) => user._id);
    const followersCountByUserId =
      await this.repository.findFollowersCountByUserIds(userIds);

    return EngagementMapper.toTrackLikersResponse(
      users,
      followersCountByUserId,
      total,
      parsedPage,
      parsedLimit,
    );
  }
}
