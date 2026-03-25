import extendedZod from '../../../shared/docs/dtoDocumenter';
import { TracksIdParamDTO } from './tracks.request.params';
import { ListTrackssQueryDto } from './tracks.request.query';
import { CreateTrackRequestBodyDTO } from './tracks.request.body';

export const DeleteTrackRequestDTO = extendedZod.object({
  params: TracksIdParamDTO,
});

export const GetTrackByIdRequestDTO = extendedZod.object({
  params: TracksIdParamDTO,
});

export const IncrementTrackListenCountRequestDTO = extendedZod.object({
  params: TracksIdParamDTO,
});

export const uploadAudioTrackRequestDTO = extendedZod.object({
  body: CreateTrackRequestBodyDTO,
});
