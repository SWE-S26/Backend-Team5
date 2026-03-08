import { AdminRequestDto } from './admin.request';
import { AdminResponseDto } from './admin.response';

export class AdminMapper {
  static toResponse(entity: any): AdminResponseDto {
    // TODO: map entity fields to response DTO
    return {} as AdminResponseDto;
  }

  static toEntity(dto: AdminRequestDto): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
