import extendedZod from '../../../shared/docs/dtoDocumenter';
import { AdminIdParamDTO } from './admin.request.params';
import { ListAdminsQueryDto } from './admin.request.query';

export const CreateAdminRequestDTO = extendedZod.object({
  params: AdminIdParamDTO,
  query: ListAdminsQueryDto,
});
