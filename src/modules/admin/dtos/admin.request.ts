import extendedZod from '../../../shared/docs/dtoDocumenter';
import { SuspendRequestBodyDTO } from './admin.request.body';
import { AdminIdParamDTO, UserIdParamDTO } from './admin.request.params';
import {
  ListAdminUsersQueryDto,
  ListAdminsQueryDto,
} from './admin.request.query';

export const GetAdminUsersRequestDTO = extendedZod.object({
  query: ListAdminUsersQueryDto,
});

export const SuspendUserRequestDTO = extendedZod.object({
  params: UserIdParamDTO,
  body: SuspendRequestBodyDTO,
});

export const UnsuspendUserRequestDTO = extendedZod.object({
  params: UserIdParamDTO,
});

export const DeleteAdminUserRequestDTO = extendedZod.object({
  params: UserIdParamDTO,
});

export const CreateAdminRequestDTO = extendedZod.object({
  params: AdminIdParamDTO,
  query: ListAdminsQueryDto,
});
