import extendedZod from '../../../shared/docs/dtoDocumenter';
import { z } from 'zod';

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

export type ToggleLikeResponse = z.infer<typeof ToggleLikeResponseDTO>;
export type ToggleRepostResponse = z.infer<typeof ToggleRepostResponseDTO>;
export type TogglePlaylistLikeResponse = z.infer<
  typeof TogglePlaylistLikeResponseDTO
>;
export type TogglePlaylistRepostResponse = z.infer<
  typeof TogglePlaylistRepostResponseDTO
>;
export type TrackLikersResponse = z.infer<typeof TrackLikersResponseDTO>;
export type TrackRepostStatusResponse = z.infer<
  typeof TrackRepostStatusResponseDTO
>;
export type PlaylistRepostStatusResponse = z.infer<
  typeof PlaylistRepostStatusResponseDTO
>;
export type UpdateRepostCaptionResponse = z.infer<
  typeof UpdateRepostCaptionResponseDTO
>;
