import extendedZod from '../../../shared/docs/dtoDocumenter';
import {
  TracksIdParamDTO,
  PermaLinkParamDTO,
  UserIdParamDTO,
} from './tracks.request.params';
import { ListTrackssQueryDto } from './tracks.request.query';
import {
  CreateTrackRequestBodyDTO,
  UpdateTrackRequestBodyDTO,
} from './tracks.request.body';

export const DeleteTrackRequestDTO = extendedZod.object({
  params: TracksIdParamDTO,
});

export const AddTrackToUserHistoryRequestDTO = extendedZod.object({
  params: TracksIdParamDTO,
});

export const GetTrackByIdRequestDTO = extendedZod.object({
  params: TracksIdParamDTO,
});

export const GetLikedTracksByUserIdRequestDTO = extendedZod.object({
  params: UserIdParamDTO,
});

export const GetPostedTracksByUserIdRequestDTO = extendedZod.object({
  params: UserIdParamDTO,
});

export const IncrementTrackListenCountRequestDTO = extendedZod.object({
  params: TracksIdParamDTO,
});

export const UploadAudioTrackRequestDTO = extendedZod.object({
  body: CreateTrackRequestBodyDTO,
});

export const UpdateTrackRequestDTO = extendedZod.object({
  body: UpdateTrackRequestBodyDTO,
});

export const PermalinkRequestDTO = extendedZod.object({
  params: PermaLinkParamDTO,
});

export const PaginationRequestDTO = extendedZod.object({
  query: ListTrackssQueryDto,
});
