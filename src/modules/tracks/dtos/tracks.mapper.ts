import { TracksRequestDto } from './tracks.request';
import { TracksResponseDto } from './tracks.response';

export class TracksMapper {
  static toResponse(entity: any): TracksResponseDto {
    // TODO: map entity fields to response DTO
    return {} as TracksResponseDto;
  }

  static toEntity(dto: TracksRequestDto): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
