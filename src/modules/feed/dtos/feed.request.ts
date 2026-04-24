import extendedZod from '../../../shared/docs/dtoDocumenter';
import {
  FeedQueryDTO,
  SearchQueryDTO,
  SuggestionsQueryDTO,
} from './feed.request.query';
import { HistoryIdParamDTO } from './feed.request.params';
import { AddToHistoryBodyDTO } from './feed.request.body';
import { idParamDto } from '../../../shared/dtos/commonDTO';

export const GetFeedRequestDTO = extendedZod.object({
  query: FeedQueryDTO,
});

export const GetTrendingTracksRequestDTO = extendedZod.object({
  params: idParamDto,
  query: FeedQueryDTO,
});

export const SearchRequestDTO = extendedZod.object({
  query: SearchQueryDTO,
});

export const SuggestionsRequestDTO = extendedZod.object({
  query: SuggestionsQueryDTO,
});

export const DeleteHistoryItemRequestDTO = extendedZod.object({
  params: HistoryIdParamDTO,
});

export const AddToHistoryRequestDTO = extendedZod.object({
  body: AddToHistoryBodyDTO,
});
