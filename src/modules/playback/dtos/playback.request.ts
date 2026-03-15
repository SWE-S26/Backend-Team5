import extendedZod from '../../../shared/docs/dtoDocumenter';
import { PlaybackIdParamDTO } from './playback.request.params';
import { ListPlaybacksQueryDto } from './playback.request.query';
import { CreatePlaybackRequestBodyDTO } from './playback.request.body';

export const CreatePlaybackRequestDTO = extendedZod.object({
  params: PlaybackIdParamDTO,
  query: ListPlaybacksQueryDto,
  body: CreatePlaybackRequestBodyDTO,
});
