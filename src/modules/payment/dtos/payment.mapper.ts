import { PaymentRequestDto } from './payment.request';
import { PaymentResponseDto } from './payment.response';

export class PaymentMapper {
  static toResponse(entity: any): PaymentResponseDto {
    // TODO: map entity fields to response DTO
    return {} as PaymentResponseDto;
  }

  static toEntity(dto: PaymentRequestDto): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
