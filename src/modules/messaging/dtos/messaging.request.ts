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

export const GetChatMessagesRequestDTO = extendedZod.object({
  params: MessagingIdParamDTO,
  query: ListMessagingsQueryDto,
});

export const MarkChatMessagesRequestDTO = extendedZod.object({
  params: MessagingIdParamDTO,
});

export const ArchiveChatRequestDTO = extendedZod.object({
  body: ArchiveChatRequestBodyDTO,
});
