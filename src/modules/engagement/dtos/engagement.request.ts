import extendedZod from '../../../shared/docs/dtoDocumenter';
import {
  EngagementIdParamDTO,
  PlaylistIdParamDTO,
  TrackIdParamDTO,
  CommentIdParamDTO,
} from './engagement.request.params';
import {
  GetTrackLikersQueryDto,
  ListEngagementsQueryDto,
  GetTrackCommentsQueryDto,
} from './engagement.request.query';
import {
  RepostRequestBodyDTO,
  UpdateRepostCaptionBodyDTO,
  CreateCommentRequestBodyDTO,
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

export const GetTrackLikeStatusRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
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

export const PostTrackCommentRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
  body: CreateCommentRequestBodyDTO,
});

export const ToggleCommentLikeRequestDTO = extendedZod.object({
  params: CommentIdParamDTO,
});

export const DeleteTrackCommentRequestDTO = extendedZod.object({
  params: CommentIdParamDTO,
});

export const GetTrackCommentsRequestDTO = extendedZod.object({
  params: TrackIdParamDTO,
  query: GetTrackCommentsQueryDto,
});

export const GetCommentRepliesRequestDTO = extendedZod.object({
  params: CommentIdParamDTO,
  query: GetTrackLikersQueryDto,
});

export const GetMentionFollowersRequestDTO = extendedZod.object({
  query: GetTrackLikersQueryDto,
});

export const GetUserRepostedTracksRequestDTO = extendedZod.object({
  query: GetTrackLikersQueryDto,
});

export const GetUserRepostedPlaylistsRequestDTO = extendedZod.object({
  query: GetTrackLikersQueryDto,
});
