import extendedZod from '../../../shared/docs/dtoDocumenter';
import { FeedIdParamDTO } from './feed.request.params';
import { ListFeedsQueryDto } from './feed.request.query';
import { CreateFeedRequestBodyDTO } from './feed.request.body';

export const CreateFeedRequestDTO = extendedZod.object({
  params: FeedIdParamDTO,
  query: ListFeedsQueryDto,
  body: CreateFeedRequestBodyDTO,
});
