import extendedZod from '../../../shared/docs/dtoDocumenter';
import { Types } from 'mongoose';
import { z } from 'zod';

export const SendNewMessageRequestBodyDTO = extendedZod.object({
  receiverId: extendedZod
    .string()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: 'Invalid ObjectId',
    }),
  content: extendedZod.string().min(1).max(2000),
});

export type SendNewMessageDTO = z.infer<typeof SendNewMessageRequestBodyDTO>;
