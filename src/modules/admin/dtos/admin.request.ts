import extendedZod from '../../../shared/docs/dtoDocumenter';
import {
  AdminActionReasonRequestBodyDTO,
  CreateReportRequestBodyDTO,
  SuspendRequestBodyDTO,
} from './admin.request.body';
import {
  AdminIdParamDTO,
  TrackIdParamDTO,
  UserIdParamDTO,
} from './admin.request.params';
import {
  ListAdminMediaQueryDto,
  ListAdminUsersQueryDto,
  ListAdminsQueryDto,
} from './admin.request.query';

export const GetAdminUsersRequestDTO = extendedZod.object({
  query: ListAdminUsersQueryDto,
});

export const GetAdminMediaRequestDTO = extendedZod.object({
  query: ListAdminMediaQueryDto,
});

export const CreateAdminReportRequestDTO = extendedZod.object({
  body: CreateReportRequestBodyDTO,
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

export const BanTrackRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
  body: AdminActionReasonRequestBodyDTO.partial().optional(),
});

export const UnbanTrackRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
});

export const DeleteAdminTrackRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
});

export const CreateAdminRequestDTO = extendedZod.object({
  params: AdminIdParamDTO,
  query: ListAdminsQueryDto,
});

export const GetAdminAnalyticsOverviewRequestDTO = extendedZod.object({});

export const GetAdminAnalyticsStorageRequestDTO = extendedZod.object({});

export const GetArtistAnalyticsRequestDTO = extendedZod.object({});
