import extendedZod from '../../../shared/docs/dtoDocumenter';
import z from 'zod';

export const AddToHistoryBodyDTO = extendedZod.object({
  id: extendedZod.mongoId(),
  type: extendedZod.enum(['track', 'user', 'playlist']),
});

export type AddToHistoryBodyDTOType = z.infer<typeof AddToHistoryBodyDTO>;
