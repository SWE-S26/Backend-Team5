import extendedZod from '../../../shared/docs/dtoDocumenter';
import { ProfileIdParamDTO } from './profile.request.params';
import { ListProfilesQueryDto } from './profile.request.query';
import { CreateProfileRequestBodyDTO } from './profile.request.body';

export const CreateProfileRequestDTO = extendedZod.object({
  params: ProfileIdParamDTO,
  query: ListProfilesQueryDto,
  body: CreateProfileRequestBodyDTO,
});
