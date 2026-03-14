import { email } from 'zod';
import extendedZod from '../../../shared/docs/dtoDocumenter';
export const CreateAuthRequestBodyDTO = extendedZod
  .object({
    email: extendedZod.string().email(),
    password: extendedZod.string().min(6),
    name: extendedZod.string().min(2),
  })
  .openapi('CreateAuthRequest', {
    example: {
      email: 'john.doe@example.com',
      password: 'secret123',
      name: 'John Doe',
    },
  });

export const checkEmailRequestBodyDTO = extendedZod
  .object({
    body: extendedZod.object({
      email: extendedZod.string().email(),
    }),
  })
  .openapi('checkEmailAuthRequest', {
    example: {
      email: 'john.doe@example.com',
    },
  });
