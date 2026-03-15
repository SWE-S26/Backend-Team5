import extendedZod from '../../../shared/docs/dtoDocumenter';
import { PlaylistsIdParamDTO } from './playlists.request.params';
import { ListPlaylistssQueryDto } from './playlists.request.query';
import { CreatePlaylistsRequestBodyDTO } from './playlists.request.body';

export const CreatePlaylistsRequestDTO = extendedZod.object({
  params: PlaylistsIdParamDTO,
  query: ListPlaylistssQueryDto,
  body: CreatePlaylistsRequestBodyDTO,
});
