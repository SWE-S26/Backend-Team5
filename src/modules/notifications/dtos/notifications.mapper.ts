import { NotificationsRequestDto } from './notifications.request';
import { NotificationsResponseDto } from './notifications.response';

export class NotificationsMapper {
  static toResponse(entity: any): NotificationsResponseDto {
    // TODO: map entity fields to response DTO
    return {} as NotificationsResponseDto;
  }

  static toEntity(dto: NotificationsRequestDto): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
