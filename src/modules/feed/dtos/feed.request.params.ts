import extendedZod from '../../../shared/docs/dtoDocumenter';

export const HistoryIdParamDTO = extendedZod.object({
  historyId: extendedZod.mongoId(),
});
