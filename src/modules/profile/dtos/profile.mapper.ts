import { ProfileRequestDto } from './profile.request';
import { ProfileResponseDto } from './profile.response';

export class ProfileMapper {
  static toResponse(entity: any): ProfileResponseDto {
    // TODO: map entity fields to response DTO
    return {} as ProfileResponseDto;
  }

  static toEntity(dto: ProfileRequestDto): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
