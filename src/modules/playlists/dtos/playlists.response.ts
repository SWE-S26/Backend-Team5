import { z } from 'zod/mini';
import extendedZod from '../../../shared/docs/dtoDocumenter';

export const PlaylistArtistDetailsDTO = extendedZod.object({
  displayName: extendedZod.string(),
  profileLink: extendedZod.string(),
  profileImage: extendedZod.object({
    imgLink: extendedZod.string(),
    publicId: extendedZod.string(),
  }),
  followersCount: extendedZod.number().int(),
  isFollowed: extendedZod.boolean(),
});

export type PlaylistArtistDetailsDTOType = z.infer<
  typeof PlaylistArtistDetailsDTO
>;
