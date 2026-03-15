import extendedZod from '../../../shared/docs/dtoDocumenter';
import { AuthIdParamDTO } from './auth.request.params';
import { ListAuthsQueryDto } from './auth.request.query';
import { CreateAuthRequestBodyDTO } from './auth.request.body';

export const CreateAuthRequestDTO = extendedZod.object({
  params: AuthIdParamDTO,
  query: ListAuthsQueryDto,
  body: CreateAuthRequestBodyDTO,
});
