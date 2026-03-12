import { PlaylistsRequestDto } from './playlists.request';
import { PlaylistsResponseDto } from './playlists.response';

export class PlaylistsMapper {
  static toResponse(entity: any): PlaylistsResponseDto {
    // TODO: map entity fields to response DTO
    return {} as PlaylistsResponseDto;
  }

  static toEntity(dto: PlaylistsRequestDto): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
