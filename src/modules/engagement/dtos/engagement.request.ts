import extendedZod from '../../../shared/docs/dtoDocumenter';
import { EngagementIdParamDTO } from './engagement.request.params';
import { ListEngagementsQueryDto } from './engagement.request.query';

export const CreateEngagementRequestDTO = extendedZod.object({
  params: EngagementIdParamDTO,
  query: ListEngagementsQueryDto,
});
