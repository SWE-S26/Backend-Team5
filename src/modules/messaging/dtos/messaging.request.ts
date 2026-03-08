import extendedZod from '../../../shared/docs/dtoDocumenter';
import { MessagingIdParamDTO } from './messaging.request.params';
import { ListMessagingsQueryDto } from './messaging.request.query';
import { CreateMessagingRequestBodyDTO } from './messaging.request.body';

export const CreateMessagingRequestDTO = extendedZod.object({
  params: MessagingIdParamDTO,
  query: ListMessagingsQueryDto,
  body: CreateMessagingRequestBodyDTO,
});
