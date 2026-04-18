import extendedZod from '../../../shared/docs/dtoDocumenter';
import { PaginationQueryDto } from '../../../shared/dtos/commonDTO';
import { Types } from 'mongoose';
import { z } from 'zod';

export const MessagingRoleQueryDto = extendedZod.object({
  role: extendedZod.enum(['user', 'admin']).optional(),
});

export const ListMessagingsQueryDto = extendedZod.object({
  before: extendedZod
    .string()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: 'Invalid ObjectId',
    })
    .optional(),
  limit: extendedZod.coerce.number().default(20),
});

export type PaginationInfo = z.infer<typeof ListMessagingsQueryDto>;
