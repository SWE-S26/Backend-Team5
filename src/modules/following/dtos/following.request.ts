import extendedZod from '../../../shared/docs/dtoDocumenter';
import { UserIdParamDTO } from './following.request.params';
import { idParamDto } from '../../../shared/dtos/commonDTO';
import { PaginationQueryDTO } from './following.request.query';

export const GetFollowersRequestDTO = extendedZod.object({
  params: idParamDto,
  query: PaginationQueryDTO,
});

export const GetFollowingRequestDTO = GetFollowersRequestDTO;

export const GetSuggestedRequestDTO = extendedZod.object({
  query: PaginationQueryDTO,
});

export const GetBlockedRequestDTO = GetSuggestedRequestDTO;
