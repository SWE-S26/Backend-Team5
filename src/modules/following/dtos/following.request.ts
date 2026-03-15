import extendedZod from '../../../shared/docs/dtoDocumenter';
import { FollowingIdParamDTO } from './following.request.params';
import { ListFollowingsQueryDto } from './following.request.query';
import { CreateFollowingRequestBodyDTO } from './following.request.body';

export const CreateFollowingRequestDTO = extendedZod.object({
  params: FollowingIdParamDTO,
  query: ListFollowingsQueryDto,
  body: CreateFollowingRequestBodyDTO,
});
