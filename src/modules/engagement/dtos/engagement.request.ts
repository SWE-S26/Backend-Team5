import extendedZod from '../../../shared/docs/dtoDocumenter';
import {
  EngagementIdParamDTO,
  TrackIdParamDTO,
} from './engagement.request.params';
import { ListEngagementsQueryDto } from './engagement.request.query';

export const CreateEngagementRequestDTO = extendedZod.object({
  params: EngagementIdParamDTO,
  query: ListEngagementsQueryDto,
});

export const ToggleTrackLikeRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
});
