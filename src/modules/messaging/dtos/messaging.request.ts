import extendedZod from '../../../shared/docs/dtoDocumenter';
import { MessagingIdParamDTO } from './messaging.request.params';
import { ListMessagingsQueryDto } from './messaging.request.query';
import {
  SendNewMessageRequestBodyDTO,
  ArchiveChatRequestBodyDTO,
} from './messaging.request.body';

export const SendNewMessageRequestDTO = extendedZod.object({
  body: SendNewMessageRequestBodyDTO,
});
export const ArchiveChatRequestDTO = extendedZod.object({
  body: ArchiveChatRequestBodyDTO,
});
