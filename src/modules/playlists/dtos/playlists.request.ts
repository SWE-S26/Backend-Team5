import extendedZod from '../../../shared/docs/dtoDocumenter';
import { PlaylistsIdParamDTO } from './playlists.request.params';
import { findAllPlaylistsQueryDto } from './playlists.request.query';
import { CreatePlaylistsRequestBodyDTO } from './playlists.request.body';
import { z } from 'zod';

export const FindAllPlaylistsDTO = extendedZod.object({
  query: findAllPlaylistsQueryDto,
});

export const FindOnePlaylistDTO = extendedZod.object({
  params: PlaylistsIdParamDTO,
});

export const CreatePlaylistDTO = extendedZod.object({
  body: CreatePlaylistsRequestBodyDTO,
});

export const DeletePlaylistDTO = extendedZod.object({
  params: PlaylistsIdParamDTO,
});

export type FindAllPlaylistsInput = z.infer<typeof FindAllPlaylistsDTO>;
export type FindOnePlaylistInput = z.infer<typeof FindOnePlaylistDTO>;
export type CreatePlaylistInput = z.infer<typeof CreatePlaylistDTO>;
export type DeletePlaylistInput = z.infer<typeof DeletePlaylistDTO>;
