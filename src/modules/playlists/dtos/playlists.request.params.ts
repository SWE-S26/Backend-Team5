import { z } from 'zod/mini';
import extendedZod from '../../../shared/docs/dtoDocumenter';
import { idParamDto } from '../../../shared/dtos/commonDTO';

export const PlaylistsIdParamDTO = idParamDto.extend({});

export const AddTrackToPlaylistParamsDTO = idParamDto.extend({
  trackId: extendedZod.mongoId(),
});

export const GetMorePlaylistsFromArtistParamsDTO = extendedZod
  .object({
    playlistId: extendedZod.mongoId(),
    artistId: extendedZod.mongoId(),
  })
  .openapi('GetMorePlaylistsFromArtistParams', {
    example: {
      playlistId: '60c72b2f9b1d4c0015b8e8f0',
      artistId: '60c72b2f9b1d4c0015b8e8f1',
    },
  });

export const GetPlaylistByPermalinkParamsDTO = extendedZod
  .object({
    permalink: extendedZod.string().min(1).max(100),
  })
  .openapi('GetPlaylistByPermalinkParams', {
    example: {
      permalink: 'my-awesome-playlist',
    },
  });

export const GetByPermaLinkParamsDTOType = extendedZod.object({
  profilelink: extendedZod.string().min(1).max(100),
  permalink: extendedZod.string().min(1).max(100),
});

export type PlaylistsIdParamDTOType = z.infer<typeof PlaylistsIdParamDTO>;
export type GetMorePlaylistsFromArtistParamsDTOType = z.infer<
  typeof GetMorePlaylistsFromArtistParamsDTO
>;
