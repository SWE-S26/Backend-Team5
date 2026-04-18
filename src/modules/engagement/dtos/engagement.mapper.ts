import { IPlaylist } from '../../../shared/models/models.playlist';
import { ITrack } from '../../../shared/models/models.track';
import { IUser } from '../../../shared/models/models.user';
import { IComment } from '../../../shared/models/models.comment';
import {
  TrackLikersResponse,
  TrackLikersResponseDTO,
  MentionFollowersResponse,
  MentionFollowersResponseDTO,
  ToggleLikeResponse,
  ToggleLikeResponseDTO,
  TogglePlaylistLikeResponse,
  TogglePlaylistLikeResponseDTO,
  ToggleRepostResponse,
  ToggleRepostResponseDTO,
  TogglePlaylistRepostResponse,
  TogglePlaylistRepostResponseDTO,
  TrackLikeStatusResponse,
  TrackLikeStatusResponseDTO,
  TrackRepostStatusResponse,
  TrackRepostStatusResponseDTO,
  PlaylistRepostStatusResponse,
  PlaylistRepostStatusResponseDTO,
  UpdateRepostCaptionResponse,
  UpdateRepostCaptionResponseDTO,
  PostCommentResponse,
  PostCommentResponseDTO,
  ToggleCommentLikeResponse,
  ToggleCommentLikeResponseDTO,
  GetTrackCommentsResponse,
  GetTrackCommentsResponseDTO,
  GetCommentRepliesResponse,
  GetCommentRepliesResponseDTO,
  DeleteCommentResponse,
  DeleteCommentResponseDTO,
  CommentEntryResponse,
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

  static toMentionFollowersResponse(
    users: Pick<IUser, '_id' | 'displayName' | 'profileImg' | 'profileLink'>[],
  ): MentionFollowersResponse {
    return MentionFollowersResponseDTO.parse(
      users.map((user) => ({
        userId: user._id.toString(),
        displayName: user.displayName,
        avatarUrl: user.profileImg?.imgLink || undefined,
        profileLink: user.profileLink,
      })),
    );
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

  static toTrackLikeStatusResponse(liked: boolean): TrackLikeStatusResponse {
    return TrackLikeStatusResponseDTO.parse({
      liked,
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

  static toPostCommentResponse(comment: IComment): PostCommentResponse {
    return PostCommentResponseDTO.parse({
      commentId: comment._id.toString(),
      content: comment.content,
      timestampSeconds: comment.timestampSeconds,
      createdAt: comment.createdAt.toISOString(),
    });
  }

  static toCommentLikeResponse(
    comment: IComment,
    liked: boolean,
  ): ToggleCommentLikeResponse {
    return ToggleCommentLikeResponseDTO.parse({
      liked,
      numLikes: comment.numLikes,
    });
  }

  static toCommentEntryResponse(
    comment: IComment & {
      user: Pick<IUser, '_id' | 'displayName' | 'profileImg'>;
      mentionedUserProfileLink?: string;
    },
    viewerId?: string,
  ): CommentEntryResponse {
    const isLikedByUser =
      viewerId !== undefined
        ? comment.likedList.some(
            (likedUserId) => likedUserId.toString() === viewerId,
          )
        : false;

    const isOwnComment =
      viewerId !== undefined ? comment.user._id.toString() === viewerId : false;

    return {
      commentId: comment._id.toString(),
      userId: comment.user._id.toString(),
      displayName: comment.user.displayName,
      avatarUrl: comment.user.profileImg?.imgLink || undefined,
      content: comment.content,
      timestamp: comment.timestampSeconds,
      numLikes: comment.numLikes,
      replyCount: comment.replyList.length,
      isLikedByUser,
      isOwnComment,
      mentionedUserProfileLink: comment.mentionedUserProfileLink,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  static toTrackCommentsResponse(
    comments: Array<
      IComment & {
        user: Pick<IUser, '_id' | 'displayName' | 'profileImg'>;
      }
    >,
    total: number,
    offset: number,
    limit: number,
    viewerId?: string,
  ): GetTrackCommentsResponse {
    return GetTrackCommentsResponseDTO.parse({
      total,
      offset,
      limit,
      comments: comments.map((comment) =>
        EngagementMapper.toCommentEntryResponse(comment, viewerId),
      ),
    });
  }

  static toCommentRepliesResponse(
    replies: Array<
      IComment & {
        user: Pick<IUser, '_id' | 'displayName' | 'profileImg'>;
      }
    >,
    total: number,
    offset: number,
    limit: number,
    viewerId?: string,
  ): GetCommentRepliesResponse {
    return GetCommentRepliesResponseDTO.parse({
      total,
      offset,
      limit,
      replies: replies.map((reply) =>
        EngagementMapper.toCommentEntryResponse(reply, viewerId),
      ),
    });
  }

  static toDeleteCommentResponse(): DeleteCommentResponse {
    return DeleteCommentResponseDTO.parse({
      message: 'Comment deleted successfully.',
    });
  }
}
