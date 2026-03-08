import extendedZod from '../../../shared/docs/dtoDocumenter';
import { PaymentIdParamDTO } from './payment.request.params';
import { ListPaymentsQueryDto } from './payment.request.query';
import { CreatePaymentRequestBodyDTO } from './payment.request.body';

export const CreatePaymentRequestDTO = extendedZod.object({
  params: PaymentIdParamDTO,
  query: ListPaymentsQueryDto,
  body: CreatePaymentRequestBodyDTO,
});
