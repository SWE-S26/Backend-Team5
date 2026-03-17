import extendedZod from '../../../shared/docs/dtoDocumenter';
import { TracksIdParamDTO } from './tracks.request.params';
import { ListTrackssQueryDto } from './tracks.request.query';
import { CreateTracksRequestBodyDTO } from './tracks.request.body';

export const CreateTracksRequestDTO = extendedZod.object({
  params: TracksIdParamDTO,
  query: ListTrackssQueryDto,
  body: CreateTracksRequestBodyDTO,
});

export const DeleteTrackRequestDTO = extendedZod.object({
  params: TracksIdParamDTO,
});
