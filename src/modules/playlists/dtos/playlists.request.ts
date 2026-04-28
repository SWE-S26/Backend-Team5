import extendedZod from '../../../shared/docs/dtoDocumenter';
import {
  GetMorePlaylistsFromArtistParamsDTO,
  PlaylistsIdParamDTO,
  AddTrackToPlaylistParamsDTO,
  GetPlaylistByPermalinkParamsDTO,
  GetByPermaLinkParamsDTOType,
} from './playlists.request.params';
import { findAllPlaylistsQueryDto } from './playlists.request.query';
import {
  CreatePlaylistsRequestBodyDTO,
  CreatePlaylistWithImageRequestBodyDTO,
  UpdatePlaylistInfoRequestBodyDTO,
  UpdatePlaylistSingleTrackOrderRequestBodyDTO,
} from './playlists.request.body';
import { z } from 'zod';

export const FindAllPlaylistsDTO = extendedZod.object({
  query: findAllPlaylistsQueryDto,
});

export const FindOnePlaylistDTO = extendedZod.object({
  params: PlaylistsIdParamDTO,
  query: findAllPlaylistsQueryDto,
});

export const CreatePlaylistDTO = extendedZod.object({
  body: CreatePlaylistsRequestBodyDTO,
});

export const DeletePlaylistDTO = extendedZod.object({
  params: PlaylistsIdParamDTO,
});

export const GetArtistDetailsDTO = extendedZod.object({
  params: PlaylistsIdParamDTO,
});

export const GetMorePlaylistsFromArtistDTO = extendedZod.object({
  params: GetMorePlaylistsFromArtistParamsDTO,
});

export const GetPlaylistByPermalinkDTO = extendedZod.object({
  params: GetPlaylistByPermalinkParamsDTO,
});

export const UpdatePlaylistSingleTrackOrderDTO = extendedZod.object({
  params: PlaylistsIdParamDTO,
  body: UpdatePlaylistSingleTrackOrderRequestBodyDTO,
});

export const UpdatePlaylistInfoDTO = extendedZod.object({
  params: PlaylistsIdParamDTO,
  body: UpdatePlaylistInfoRequestBodyDTO,
});

export const AddTrackToPlaylistDTO = extendedZod.object({
  params: AddTrackToPlaylistParamsDTO,
});

export const CreatePlaylistWithImageDTO = extendedZod.object({
  body: CreatePlaylistWithImageRequestBodyDTO,
});

export const GetByPermaLinkDTO = extendedZod.object({
  params: GetByPermaLinkParamsDTOType,
  query: findAllPlaylistsQueryDto,
});

export type FindAllPlaylistsInput = z.infer<typeof FindAllPlaylistsDTO>;
export type FindOnePlaylistInput = z.infer<typeof FindOnePlaylistDTO>;
export type CreatePlaylistInput = z.infer<typeof CreatePlaylistDTO>;
export type DeletePlaylistInput = z.infer<typeof DeletePlaylistDTO>;
export type GetArtistDetailsInput = z.infer<typeof GetArtistDetailsDTO>;
export type GetMorePlaylistsFromArtistInput = z.infer<
  typeof GetMorePlaylistsFromArtistDTO
>;
export type UpdatePlaylistSingleTrackOrderInput = z.infer<
  typeof UpdatePlaylistSingleTrackOrderDTO
>;
export type UpdatePlaylistInfoInput = z.infer<typeof UpdatePlaylistInfoDTO> & {
  imageFile: Express.Multer.File;
};
export type CreatePlaylistWithImageInput = z.infer<
  typeof CreatePlaylistWithImageDTO
> & {
  imageFile: Express.Multer.File;
};
