import extendedZod from '../../../shared/docs/dtoDocumenter';

export const HistoryIdParamDTO = extendedZod.object({
  params: extendedZod.object({
    historyId: extendedZod.mongoId(),
  }),
});
