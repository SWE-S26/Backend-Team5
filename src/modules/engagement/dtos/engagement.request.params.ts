import extendedZod from '../../../shared/docs/dtoDocumenter';
import { idParamDto } from '../../../shared/dtos/commonDTO';

export const EngagementIdParamDTO = idParamDto.extend({});

export const TrackIdParamDTO = extendedZod.object({
  trackId: extendedZod.mongoId(),
});

export const PlaylistIdParamDTO = extendedZod.object({
  playlistId: extendedZod.mongoId(),
});

export const CommentIdParamDTO = extendedZod.object({
  commentId: extendedZod.mongoId(),
});

export const TrackCommentIdParamDTO = extendedZod.object({
  trackId: extendedZod.mongoId(),
  commentId: extendedZod.mongoId(),
});

export const UserIdParamDTO = extendedZod.object({
  userId: extendedZod.mongoId(),
});
