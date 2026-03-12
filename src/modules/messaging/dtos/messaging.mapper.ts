import { MessagingRequestDto } from './messaging.request';
import { MessagingResponseDto } from './messaging.response';

export class MessagingMapper {
  static toResponse(entity: any): MessagingResponseDto {
    // TODO: map entity fields to response DTO
    return {} as MessagingResponseDto;
  }

  static toEntity(dto: MessagingRequestDto): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
