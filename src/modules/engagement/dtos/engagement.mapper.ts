import { EngagementRequestDto } from './engagement.request';
import { EngagementResponseDto } from './engagement.response';

export class EngagementMapper {
  static toResponse(entity: any): EngagementResponseDto {
    // TODO: map entity fields to response DTO
    return {} as EngagementResponseDto;
  }

  static toEntity(dto: EngagementRequestDto): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
