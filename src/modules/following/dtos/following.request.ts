import extendedZod from '../../../shared/docs/dtoDocumenter';
import { UserIdParamDTO } from './following.request.params';
import { PaginationQueryDTO } from './following.request.query';

export const GetFollowersRequestDTO = extendedZod.object({
  params: UserIdParamDTO,
  query: PaginationQueryDTO,
});

export const GetFollowingRequestDTO = extendedZod.object({
  params: UserIdParamDTO,
  query: PaginationQueryDTO,
});

export const GetSuggestedRequestDTO = extendedZod.object({
  query: PaginationQueryDTO,
});

export const GetBlockedRequestDTO = extendedZod.object({
  query: PaginationQueryDTO,
});

export const FollowUserRequestDTO = extendedZod.object({
  params: UserIdParamDTO,
});
export const UnfollowUserRequestDTO = FollowUserRequestDTO;
export const BlockUserRequestDTO = FollowUserRequestDTO;
export const UnblockUserRequestDTO = FollowUserRequestDTO;
