import { FeedRequestDto } from './feed.request';
import { FeedResponseDto } from './feed.response';

export class FeedMapper {
  static toResponse(entity: any): FeedResponseDto {
    // TODO: map entity fields to response DTO
    return {} as FeedResponseDto;
  }

  static toEntity(dto: FeedRequestDto): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
