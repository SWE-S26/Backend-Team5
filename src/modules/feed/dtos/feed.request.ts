import extendedZod from '../../../shared/docs/dtoDocumenter';
import {
  FeedQueryDTO,
  SearchQueryDTO,
  SuggestionsQueryDTO,
} from './feed.request.query';
import { HistoryIdParamDTO } from './feed.request.params';
import { AddToHistoryBodyDTO } from './feed.request.body';

export const GetFeedRequestDTO = extendedZod.object({
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
