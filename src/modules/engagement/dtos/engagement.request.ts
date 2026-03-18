import extendedZod from '../../../shared/docs/dtoDocumenter';
import {
  EngagementIdParamDTO,
  PlaylistIdParamDTO,
  TrackIdParamDTO,
} from './engagement.request.params';
import {
  GetTrackLikersQueryDto,
  ListEngagementsQueryDto,
} from './engagement.request.query';
import {
  RepostRequestBodyDTO,
  UpdateRepostCaptionBodyDTO,
} from './engagement.request.body';

export const CreateEngagementRequestDTO = extendedZod.object({
  params: EngagementIdParamDTO,
  query: ListEngagementsQueryDto,
});

export const ToggleTrackLikeRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
});

export const TogglePlaylistLikeRequestDTO = extendedZod.object({
  params: PlaylistIdParamDTO,
});

export const ToggleTrackRepostRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
  body: RepostRequestBodyDTO.optional(),
});

export const GetTrackLikersRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
  query: GetTrackLikersQueryDto,
});

export const GetPlaylistLikersRequestDTO = extendedZod.object({
  params: PlaylistIdParamDTO,
  query: GetTrackLikersQueryDto,
});

export const GetTrackRepostersRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
  query: GetTrackLikersQueryDto,
});

export const GetPlaylistRepostersRequestDTO = extendedZod.object({
  params: PlaylistIdParamDTO,
  query: GetTrackLikersQueryDto,
});

export const GetTrackRepostStatusRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
});

export const UpdateTrackRepostRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
  body: UpdateRepostCaptionBodyDTO,
});

export const TogglePlaylistRepostRequestDTO = extendedZod.object({
  params: PlaylistIdParamDTO,
  body: RepostRequestBodyDTO.optional(),
});

export const GetPlaylistRepostStatusRequestDTO = extendedZod.object({
  params: PlaylistIdParamDTO,
});

export const UpdatePlaylistRepostRequestDTO = extendedZod.object({
  params: PlaylistIdParamDTO,
  body: UpdateRepostCaptionBodyDTO,
});
