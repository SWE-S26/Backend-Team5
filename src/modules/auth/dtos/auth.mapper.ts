import { AuthRequestDto } from './auth.request';
import { AuthResponseDto } from './auth.response';

export class AuthMapper {
  static toResponse(entity: any): AuthResponseDto {
    // TODO: map entity fields to response DTO
    return {} as AuthResponseDto;
  }

  static toEntity(dto: AuthRequestDto): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
