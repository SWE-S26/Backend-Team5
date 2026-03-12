import extendedZod from '../../../shared/docs/dtoDocumenter';
import { EngagementIdParamDTO } from './engagement.request.params';
import { ListEngagementsQueryDto } from './engagement.request.query';
import { CreateEngagementRequestBodyDTO } from './engagement.request.body';

export const CreateEngagementRequestDTO = extendedZod.object({
  params: EngagementIdParamDTO,
  query: ListEngagementsQueryDto,
  body: CreateEngagementRequestBodyDTO,
});
