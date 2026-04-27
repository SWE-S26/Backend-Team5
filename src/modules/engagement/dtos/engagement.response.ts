import extendedZod from '../../../shared/docs/dtoDocumenter';
import { z } from 'zod';
import { TrackResponsePublic } from '../../tracks/dtos/tracks.response';

export const ToggleLikeResponseDTO = extendedZod
  .object({
    liked: extendedZod.boolean(),
    numOfLikes: extendedZod.number().int().min(0),
  })
  .openapi('ToggleLikeResponse', {
    example: {
      liked: true,
      numOfLikes: 42,
    },
  });

export const ToggleRepostResponseDTO = extendedZod
  .object({
    reposted: extendedZod.boolean(),
    numberOfReposts: extendedZod.number().int().min(0),
  })
  .openapi('ToggleRepostResponse', {
    example: {
      reposted: true,
      numberOfReposts: 15,
    },
  });

export const ToggleCommentLikeResponseDTO = extendedZod
  .object({
    liked: extendedZod.boolean(),
    numLikes: extendedZod.number().int().min(0),
  })
  .openapi('ToggleCommentLikeResponse', {
    example: {
      liked: true,
      numLikes: 7,
    },
  });

export const TogglePlaylistLikeResponseDTO = extendedZod
  .object({
    liked: extendedZod.boolean(),
    numOfLikes: extendedZod.number().int().min(0),
  })
  .openapi('TogglePlaylistLikeResponse', {
    example: {
      liked: true,
      numOfLikes: 10,
    },
  });

export const TogglePlaylistRepostResponseDTO = extendedZod
  .object({
    reposted: extendedZod.boolean(),
    numberOfReposts: extendedZod.number().int().min(0),
  })
  .openapi('TogglePlaylistRepostResponse', {
    example: {
      reposted: false,
      numberOfReposts: 3,
    },
  });

export const TrackLikerUserResponseDTO = extendedZod.object({
  userId: extendedZod.string(),
  displayName: extendedZod.string(),
  avatarUrl: extendedZod.string().optional(),
  followersCount: extendedZod.number().int().min(0),
});

export const TrackLikersResponseDTO = extendedZod.object({
  total: extendedZod.number().int().min(0),
  offset: extendedZod.number().int().min(0),
  limit: extendedZod.number().int().min(1),
  users: extendedZod.array(TrackLikerUserResponseDTO),
});

export const MentionFollowerResponseDTO = extendedZod.object({
  userId: extendedZod.string(),
  displayName: extendedZod.string(),
  avatarUrl: extendedZod.string().optional(),
  profileLink: extendedZod.string(),
});

export const MentionFollowersResponseDTO = extendedZod.array(
  MentionFollowerResponseDTO,
);

export const RepostedTrackItemResponseDTO = TrackResponsePublic.extend({
  repostCaption: extendedZod.string().optional(),
});

export const RepostedPlaylistItemResponseDTO = extendedZod
  .object({
    repostCaption: extendedZod.string().optional(),
  })
  .passthrough();

export const RepostedTracksResponseDTO = extendedZod.object({
  total: extendedZod.number().int().min(0),
  offset: extendedZod.number().int().min(0),
  limit: extendedZod.number().int().min(1),
  tracks: extendedZod.array(RepostedTrackItemResponseDTO),
});

export const RepostedPlaylistsResponseDTO = extendedZod.object({
  total: extendedZod.number().int().min(0),
  offset: extendedZod.number().int().min(0),
  limit: extendedZod.number().int().min(1),
  playlists: extendedZod.array(RepostedPlaylistItemResponseDTO),
});

export const TrackLikeStatusResponseDTO = extendedZod
  .object({
    liked: extendedZod.boolean(),
  })
  .openapi('TrackLikeStatusResponse', {
    example: {
      liked: true,
    },
  });

export const TrackRepostStatusResponseDTO = extendedZod
  .object({
    reposted: extendedZod.boolean(),
    caption: extendedZod.string().optional(),
    repostedAt: extendedZod.string().optional(),
  })
  .openapi('TrackRepostStatusResponse', {
    example: {
      reposted: true,
      caption: 'Love this track!',
      repostedAt: '2025-01-15T12:00:00Z',
    },
  });

export const UpdateRepostCaptionResponseDTO = extendedZod
  .object({
    success: extendedZod.boolean(),
    caption: extendedZod.string(),
  })
  .openapi('UpdateRepostCaptionResponse', {
    example: {
      success: true,
      caption: 'Updated caption text!',
    },
  });

export const PlaylistRepostStatusResponseDTO = extendedZod
  .object({
    reposted: extendedZod.boolean(),
    caption: extendedZod.string().optional(),
    repostedAt: extendedZod.string().optional(),
  })
  .openapi('PlaylistRepostStatusResponse', {
    example: {
      reposted: true,
      caption: 'Amazing playlist!',
      repostedAt: '2025-01-15T12:00:00Z',
    },
  });

export const PostCommentResponseDTO = extendedZod
  .object({
    commentId: extendedZod.string(),
    content: extendedZod.string(),
    timestampSeconds: extendedZod.number().int().min(0),
    createdAt: extendedZod.string(),
  })
  .openapi('PostCommentResponse', {
    example: {
      commentId: '507f1f77bcf86cd799439011',
      content: 'Great track!',
      timestampSeconds: 42,
      createdAt: '2025-01-15T12:00:00Z',
    },
  });

export const CommentEntryResponseDTO = extendedZod
  .object({
    commentId: extendedZod.string(),
    userId: extendedZod.string(),
    displayName: extendedZod.string(),
    avatarUrl: extendedZod.string().optional(),
    content: extendedZod.string(),
    timestamp: extendedZod.number().min(0),
    numLikes: extendedZod.number().int().min(0),
    replyCount: extendedZod.number().int().min(0),
    isLikedByUser: extendedZod.boolean(),
    isOwnComment: extendedZod.boolean(),
    mentionedUserProfileLink: extendedZod.string().optional(),
    createdAt: extendedZod.string(),
  })
  .openapi('CommentEntry', {
    example: {
      commentId: '507f1f77bcf86cd799439011',
      userId: '507f1f77bcf86cd799439012',
      displayName: 'Jane Smith',
      avatarUrl: 'https://cdn.example.com/avatars/user.jpg',
      content: 'Amazing track!',
      timestamp: 30,
      numLikes: 5,
      replyCount: 2,
      isLikedByUser: false,
      isOwnComment: false,
      mentionedUserProfileLink: 'jane-smith-ab12c',
      createdAt: '2025-01-15T12:00:00Z',
    },
  });

export const GetTrackCommentsResponseDTO = extendedZod
  .object({
    total: extendedZod.number().int().min(0),
    offset: extendedZod.number().int().min(1),
    limit: extendedZod.number().int().min(1),
    comments: extendedZod.array(CommentEntryResponseDTO),
  })
  .openapi('CommentListResponse', {
    example: {
      total: 50,
      offset: 1,
      limit: 20,
      comments: [],
    },
  });

export const GetCommentRepliesResponseDTO = extendedZod
  .object({
    total: extendedZod.number().int().min(0),
    offset: extendedZod.number().int().min(1),
    limit: extendedZod.number().int().min(1),
    replies: extendedZod.array(CommentEntryResponseDTO),
  })
  .openapi('ReplyListResponse', {
    example: {
      total: 10,
      offset: 1,
      limit: 20,
      replies: [],
    },
  });

export const DeleteCommentResponseDTO = extendedZod
  .object({
    message: extendedZod.string(),
  })
  .openapi('DeleteCommentResponse', {
    example: {
      message: 'Comment deleted successfully.',
    },
  });

export type ToggleLikeResponse = z.infer<typeof ToggleLikeResponseDTO>;
export type ToggleRepostResponse = z.infer<typeof ToggleRepostResponseDTO>;
export type ToggleCommentLikeResponse = z.infer<
  typeof ToggleCommentLikeResponseDTO
>;
export type TogglePlaylistLikeResponse = z.infer<
  typeof TogglePlaylistLikeResponseDTO
>;
export type TogglePlaylistRepostResponse = z.infer<
  typeof TogglePlaylistRepostResponseDTO
>;
export type TrackLikersResponse = z.infer<typeof TrackLikersResponseDTO>;
export type MentionFollowerResponse = z.infer<
  typeof MentionFollowerResponseDTO
>;
export type MentionFollowersResponse = z.infer<
  typeof MentionFollowersResponseDTO
>;
export type RepostedTracksResponse = z.infer<typeof RepostedTracksResponseDTO>;
export type RepostedPlaylistsResponse = z.infer<
  typeof RepostedPlaylistsResponseDTO
>;
export type TrackLikeStatusResponse = z.infer<
  typeof TrackLikeStatusResponseDTO
>;
export type TrackRepostStatusResponse = z.infer<
  typeof TrackRepostStatusResponseDTO
>;
export type PlaylistRepostStatusResponse = z.infer<
  typeof PlaylistRepostStatusResponseDTO
>;
export type UpdateRepostCaptionResponse = z.infer<
  typeof UpdateRepostCaptionResponseDTO
>;
export type PostCommentResponse = z.infer<typeof PostCommentResponseDTO>;
export type CommentEntryResponse = z.infer<typeof CommentEntryResponseDTO>;
export type GetTrackCommentsResponse = z.infer<
  typeof GetTrackCommentsResponseDTO
>;
export type GetCommentRepliesResponse = z.infer<
  typeof GetCommentRepliesResponseDTO
>;
export type DeleteCommentResponse = z.infer<typeof DeleteCommentResponseDTO>;
