import extendedZod from '../../../shared/docs/dtoDocumenter';
import { idParamDto } from '../../../shared/dtos/commonDTO';

export const EngagementIdParamDTO = idParamDto.extend({});

export const TrackIdParamDTO = extendedZod.object({
  trackId: extendedZod.mongoId(),
});
