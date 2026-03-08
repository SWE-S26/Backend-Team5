import { FollowingRequestDto } from './following.request';
import { FollowingResponseDto } from './following.response';

export class FollowingMapper {
  static toResponse(entity: any): FollowingResponseDto {
    // TODO: map entity fields to response DTO
    return {} as FollowingResponseDto;
  }

  static toEntity(dto: FollowingRequestDto): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
