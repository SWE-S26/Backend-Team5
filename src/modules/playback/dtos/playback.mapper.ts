import { PlaybackRequestDto } from './playback.request';
import { PlaybackResponseDto } from './playback.response';

export class PlaybackMapper {
  static toResponse(entity: any): PlaybackResponseDto {
    // TODO: map entity fields to response DTO
    return {} as PlaybackResponseDto;
  }

  static toEntity(dto: PlaybackRequestDto): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
