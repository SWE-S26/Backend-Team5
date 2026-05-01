import extendedZod from '../../../shared/docs/dtoDocumenter';
import {
  TracksIdParamDTO,
  PermaLinkParamDTO,
  UserIdParamDTO,
  ProfilePermalinkParamDTO,
  UpdateMobileProPreviewParamDTO,
} from './tracks.request.params';
import { ListTrackssQueryDto } from './tracks.request.query';
import {
  CreateTrackRequestBodyDTO,
  CreateTrackRequestBodyDTOV2,
  UpdateTrackRequestBodyDTO,
  UpdateTrackRequestBodyDTOV2,
  IncrementTrackNumPlaysRequestBodyDTO,
  DownloadTrackIncrementRequestBodyDTO,
  UpdateTrackMobileProPreviewRequestBodyDTO,
} from './tracks.request.body';

export const DeleteTrackRequestDTO = extendedZod.object({
  params: TracksIdParamDTO,
});

export const DownloadTrackIncrementRequestDTO = extendedZod.object({
  body: DownloadTrackIncrementRequestBodyDTO,
});

export const IsValidPermaLinkForUser = extendedZod.object({
  params: PermaLinkParamDTO,
});

export const AddTrackToUserHistoryRequestDTO = extendedZod.object({
  params: TracksIdParamDTO,
});

export const GetUserTrackDetailedInfoRequestDTO = extendedZod.object({
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

export const TrackStatsRequestDTO = extendedZod.object({
  params: TracksIdParamDTO,
});

export const IncrementTrackListenCountRequestDTOV2 = extendedZod.object({
  body: IncrementTrackNumPlaysRequestBodyDTO,
});

export const UploadAudioTrackRequestDTO = extendedZod.object({
  body: CreateTrackRequestBodyDTO,
});

export const UploadAudioTrackRequestDTOV2 = extendedZod.object({
  body: CreateTrackRequestBodyDTOV2,
});

export const UpdateTrackRequestDTO = extendedZod.object({
  body: UpdateTrackRequestBodyDTO,
});

export const UpdateTrackRequestDTOV2 = extendedZod.object({
  body: UpdateTrackRequestBodyDTOV2,
});

export const GetTrackByProfilePermalinkRequestDTO = extendedZod.object({
  params: ProfilePermalinkParamDTO,
});

export const PaginationRequestDTO = extendedZod.object({
  query: ListTrackssQueryDto,
});

export const UpdateTrackMobileProPreviewRequestDTO = extendedZod.object({
  params: UpdateMobileProPreviewParamDTO,
  body: UpdateTrackMobileProPreviewRequestBodyDTO,
});
