import z from 'zod';
import extendedZod from '../../../shared/docs/dtoDocumenter';

export const UserSummaryDTO = extendedZod.object({
  userId: extendedZod.mongoId(),
  displayName: extendedZod.string(),
  profileImgLink: extendedZod.string().url().nullable(),
  trackCount: extendedZod.number(),
  followersCount: extendedZod.number(),
});

export type UserSummaryDTOType = z.infer<typeof UserSummaryDTO>;
