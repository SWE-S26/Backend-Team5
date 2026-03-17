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

export type ToggleLikeResponse = z.infer<typeof ToggleLikeResponseDTO>;
export type TogglePlaylistLikeResponse = z.infer<
  typeof TogglePlaylistLikeResponseDTO
>;
