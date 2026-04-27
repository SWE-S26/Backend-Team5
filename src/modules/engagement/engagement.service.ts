import { Types } from 'mongoose';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../shared/errors/responseErrors';
import { EngagementRepository } from './engagement.repository';
import { EngagementMapper } from './dtos/engagement.mapper';
import {
  TrackLikersResponse,
  MentionFollowersResponse,
  RepostedTracksResponse,
  RepostedPlaylistsResponse,
  ToggleLikeResponse,
  TogglePlaylistLikeResponse,
  ToggleRepostResponse,
  TogglePlaylistRepostResponse,
  TrackRepostStatusResponse,
  TrackLikeStatusResponse,
  PlaylistRepostStatusResponse,
  UpdateRepostCaptionResponse,
  PostCommentResponse,
  ToggleCommentLikeResponse,
  GetTrackCommentsResponse,
  GetCommentRepliesResponse,
  DeleteCommentResponse,
} from './dtos/engagement.response';
import { EngagementEmailService } from './engagement.email';
import { getNotificationSocketHandler } from '../../sockets/handlers/notification.handler';

export class EngagementService {
  private emailService: EngagementEmailService;

  constructor(private readonly repository: EngagementRepository) {
    this.emailService = new EngagementEmailService(repository);
  }

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

    // (async, don't await)
    this.emailService
      .sendTrackLikeEmail(trackId, userId)
      .catch((err) => console.error('Failed to send track like email:', err));

    this.sendTrackLikeSocketNotification(userId, trackId);

    return EngagementMapper.toTrackLikeResponse(updated, true);
  }

  private sendTrackLikeSocketNotification(
    actorId: string,
    trackId: string,
  ): void {
    let notificationHandler;

    try {
      notificationHandler = getNotificationSocketHandler();
    } catch {
      return;
    }

    notificationHandler
      .sendLikeNotification(actorId, trackId)
      .catch((err) =>
        console.error('Failed to send track like socket notification:', err),
      );
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

    // (async, don't await)
    this.emailService
      .sendTrackRepostEmail(trackId, userId)
      .catch((err) => console.error('Failed to send track repost email:', err));

    this.sendTrackRepostSocketNotification(userId, trackId);

    return EngagementMapper.toTrackRepostResponse(updated, true);
  }

  private sendTrackRepostSocketNotification(
    actorId: string,
    trackId: string,
  ): void {
    let notificationHandler;

    try {
      notificationHandler = getNotificationSocketHandler();
    } catch {
      return;
    }

    notificationHandler
      .sendRepostNotification(actorId, trackId)
      .catch((err) =>
        console.error('Failed to send track repost socket notification:', err),
      );
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

    // (async, don't await)
    this.emailService
      .sendPlaylistLikeEmail(playlistId, userId)
      .catch((err) =>
        console.error('Failed to send playlist like email:', err),
      );

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

  async getMentionFollowers(
    userId: string,
    offset = '0',
    limit = '20',
  ): Promise<MentionFollowersResponse> {
    const parsedOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
    const parsedLimit = Math.max(1, Number.parseInt(limit, 10) || 20);

    const users = await this.repository.findMentionFollowers(
      userId,
      parsedOffset,
      parsedLimit,
    );

    return EngagementMapper.toMentionFollowersResponse(users);
  }

  async getUserRepostedTracks(
    userId: string,
    offset = '0',
    limit = '20',
  ): Promise<RepostedTracksResponse> {
    const userExists = await this.repository.userExists(userId);
    if (!userExists) NotFoundError('User not found');

    const parsedOffset = Math.max(1, Number.parseInt(offset, 10) || 1);
    const parsedLimit = Math.max(1, Number.parseInt(limit, 10) || 20);

    const { trackReposts, total } =
      await this.repository.findUserRepostedTrackIds(
        userId,
        parsedOffset,
        parsedLimit,
      );

    const trackIds = trackReposts.map((repost) => repost.id);
    const trackCaptionsById = trackReposts.reduce<Record<string, string>>(
      (acc, repost) => {
        const caption = repost.caption?.trim();
        if (caption) {
          acc[repost.id] = caption;
        }
        return acc;
      },
      {},
    );

    if (trackIds.length === 0) {
      return EngagementMapper.toRepostedTracksResponse(
        [],
        total,
        parsedOffset,
        parsedLimit,
        trackCaptionsById,
      );
    }

    const tracks = await this.repository.findTracksByIds(trackIds);
    return EngagementMapper.toRepostedTracksResponse(
      tracks,
      total,
      parsedOffset,
      parsedLimit,
      trackCaptionsById,
    );
  }

  async getUserRepostedPlaylists(
    userId: string,
    offset = '0',
    limit = '20',
  ): Promise<RepostedPlaylistsResponse> {
    const userExists = await this.repository.userExists(userId);
    if (!userExists) NotFoundError('User not found');

    const parsedOffset = Math.max(1, Number.parseInt(offset, 10) || 1);
    const parsedLimit = Math.max(1, Number.parseInt(limit, 10) || 20);

    const { playlistReposts, total } =
      await this.repository.findUserRepostedPlaylistIds(
        userId,
        parsedOffset,
        parsedLimit,
      );

    const playlistIds = playlistReposts.map((repost) => repost.id);
    const playlistCaptionsById = playlistReposts.reduce<Record<string, string>>(
      (acc, repost) => {
        const caption = repost.caption?.trim();
        if (caption) {
          acc[repost.id] = caption;
        }
        return acc;
      },
      {},
    );

    if (playlistIds.length === 0) {
      return EngagementMapper.toRepostedPlaylistsResponse(
        [],
        total,
        parsedOffset,
        parsedLimit,
        playlistCaptionsById,
      );
    }

    const playlists = await this.repository.findPlaylistsByIds(playlistIds);
    return EngagementMapper.toRepostedPlaylistsResponse(
      playlists,
      total,
      parsedOffset,
      parsedLimit,
      playlistCaptionsById,
    );
  }

  async getTrackLikeStatus(
    trackId: string,
    userId: string,
  ): Promise<TrackLikeStatusResponse> {
    const track = await this.repository.findTrackById(trackId);

    if (!track) NotFoundError('Track not found');

    const userObjectId = new Types.ObjectId(userId);
    const liked = track!.likedBy.some((id) => id.equals(userObjectId));

    return EngagementMapper.toTrackLikeStatusResponse(liked);
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

    // (async, don't await)
    this.emailService
      .sendPlaylistRepostEmail(playlistId, userId)
      .catch((err) =>
        console.error('Failed to send playlist repost email:', err),
      );

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

  async postTrackComment(
    trackId: string,
    userId: string,
    content: string,
    timestampSeconds?: number,
    parentCommentId?: string,
    mentionedUserId?: string,
  ): Promise<PostCommentResponse> {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      BadRequestError("content can't be empty");
    }

    const isReply = Boolean(parentCommentId);

    if (!isReply && timestampSeconds !== undefined) {
      if (!Number.isInteger(timestampSeconds) || timestampSeconds < 0) {
        BadRequestError('timestamp must be a non-negative integer');
      }
    }

    const track =
      await this.repository.findTrackByIdForCommentCreation(trackId);
    if (!track) NotFoundError('Track not found');

    if (
      !isReply &&
      timestampSeconds !== undefined &&
      timestampSeconds > track!.durationInSeconds
    ) {
      BadRequestError('timestamp cannot exceed track duration in seconds');
    }

    let commentTimestampSeconds = timestampSeconds ?? 0;

    if (parentCommentId) {
      const parentComment =
        await this.repository.findCommentById(parentCommentId);
      if (!parentComment) {
        BadRequestError('Parent comment not found');
      }
      if (parentComment!.trackId.toString() !== trackId) {
        BadRequestError('Parent comment does not belong to this track');
      }

      commentTimestampSeconds = parentComment!.timestampSeconds;
    }

    if (mentionedUserId !== undefined) {
      if (mentionedUserId === userId) {
        BadRequestError('You cannot mention yourself');
      }

      const mentionedUser = await this.repository.findUserById(mentionedUserId);
      if (!mentionedUser) {
        NotFoundError('Mentioned user not found');
      }
    }

    const isMentioningTrackOwner =
      !isReply &&
      mentionedUserId !== undefined &&
      track!.posterId?.toString() === mentionedUserId;

    const comment = await this.repository.createComment(
      userId,
      trackId,
      trimmedContent,
      commentTimestampSeconds,
      mentionedUserId,
    );

    await this.repository.addCommentToTrack(trackId, comment._id.toString());

    if (parentCommentId) {
      await this.repository.addReplyToComment(
        parentCommentId,
        comment._id.toString(),
      );
    }

    const response = EngagementMapper.toPostCommentResponse(comment);

    // (async, don't await)
    // Only send track-comment notifications for top-level comments.
    // If the track owner is explicitly mentioned, send only mention notification.
    if (!parentCommentId && !isMentioningTrackOwner) {
      this.emailService
        .sendTrackCommentEmail(trackId, userId)
        .catch((err) =>
          console.error('Failed to send track comment email:', err),
        );

      this.sendTrackCommentSocketNotification(userId, comment._id.toString());
    }

    if (mentionedUserId !== undefined) {
      this.sendCommentMentionSocketNotification(userId, comment._id.toString());
    }

    return response;
  }

  private sendTrackCommentSocketNotification(
    actorId: string,
    commentId: string,
  ): void {
    let notificationHandler;

    try {
      notificationHandler = getNotificationSocketHandler();
    } catch {
      return;
    }

    notificationHandler
      .sendCommentNotification(actorId, commentId)
      .catch((err) =>
        console.error('Failed to send track comment socket notification:', err),
      );
  }

  private sendCommentMentionSocketNotification(
    actorId: string,
    commentId: string,
  ): void {
    let notificationHandler;

    try {
      notificationHandler = getNotificationSocketHandler();
    } catch {
      return;
    }

    notificationHandler
      .sendMentionNotification(actorId, commentId)
      .catch((err) =>
        console.error('Failed to send mention socket notification:', err),
      );
  }

  async toggleCommentLike(
    commentId: string,
    userId: string,
  ): Promise<ToggleCommentLikeResponse> {
    const comment = await this.repository.findCommentByIdWithLikes(commentId);

    if (!comment) NotFoundError('Comment not found');

    const userObjectId = new Types.ObjectId(userId);
    const alreadyLiked = comment!.likedList.some((id) =>
      id.equals(userObjectId),
    );

    if (alreadyLiked) {
      const updated = await this.repository.removeLikeFromComment(
        commentId,
        userId,
      );
      return EngagementMapper.toCommentLikeResponse(updated, false);
    }

    const updated = await this.repository.addLikeToComment(commentId, userId);
    return EngagementMapper.toCommentLikeResponse(updated, true);
  }

  async getTrackComments(
    trackId: string,
    page = '1',
    limit = '20',
    sortBy: 'newest' | 'oldest' | 'trackTime' = 'newest',
    viewerId?: string,
  ): Promise<GetTrackCommentsResponse> {
    const track = await this.repository.findTrackById(trackId);

    if (!track) NotFoundError('Track not found');

    const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Number.parseInt(limit, 10) || 20);

    const { comments, total } = await this.repository.getTrackComments(
      trackId,
      parsedPage,
      parsedLimit,
      sortBy,
    );

    return EngagementMapper.toTrackCommentsResponse(
      comments,
      total,
      parsedPage,
      parsedLimit,
      viewerId,
    );
  }

  async getCommentReplies(
    commentId: string,
    page = '1',
    limit = '20',
    viewerId?: string,
  ): Promise<GetCommentRepliesResponse> {
    const comment = await this.repository.findCommentById(commentId);

    if (!comment) NotFoundError('Comment not found');

    const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Number.parseInt(limit, 10) || 20);

    const { replies, total } = await this.repository.getCommentReplies(
      commentId,
      parsedPage,
      parsedLimit,
    );

    return EngagementMapper.toCommentRepliesResponse(
      replies,
      total,
      parsedPage,
      parsedLimit,
      viewerId,
    );
  }

  async deleteTrackComment(
    commentId: string,
    userId: string,
  ): Promise<DeleteCommentResponse> {
    const comment = await this.repository.findCommentById(commentId);

    if (!comment) NotFoundError('Comment not found');

    const existingComment = comment as NonNullable<typeof comment>;
    const trackId = existingComment.trackId.toString();

    const track = await this.repository.findTrackByIdForComments(trackId);

    if (!track) NotFoundError('Track not found');

    const existingTrack = track as NonNullable<typeof track>;

    const isCommentAuthor = existingComment.userId.toString() === userId;
    const isTrackOwner = existingTrack.posterId.toString() === userId;

    if (!isCommentAuthor && !isTrackOwner) {
      ForbiddenError('You are not allowed to delete this comment');
    }

    const [parentComment, commentTreeIds] = await Promise.all([
      this.repository.findParentCommentByReplyId(commentId),
      this.collectCommentTreeIds(commentId),
    ]);

    await Promise.all([
      this.repository.removeCommentsFromTrack(trackId, commentTreeIds),
      this.repository.deleteComments(commentTreeIds),
      parentComment
        ? this.repository.removeCommentFromParent(
            parentComment._id.toString(),
            commentId,
          )
        : Promise.resolve(),
    ]);

    return EngagementMapper.toDeleteCommentResponse();
  }

  private async collectCommentTreeIds(
    rootCommentId: string,
  ): Promise<string[]> {
    const visited = new Set<string>();
    const queue: string[] = [rootCommentId];

    while (queue.length > 0) {
      const currentBatch = queue.splice(0, 100);
      const comments = await this.repository.findCommentsByIds(currentBatch);

      for (const comment of comments) {
        const commentId = comment._id.toString();
        if (visited.has(commentId)) {
          continue;
        }

        visited.add(commentId);

        for (const replyId of comment.replyList) {
          const replyIdAsString = replyId.toString();
          if (!visited.has(replyIdAsString)) {
            queue.push(replyIdAsString);
          }
        }
      }
    }

    return Array.from(visited);
  }
}
