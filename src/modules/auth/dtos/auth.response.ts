import { profile } from 'node:console';
import extendedZod from '../../../shared/docs/dtoDocumenter';
import { z } from 'zod';
// In case you just respond with a message, no nned for a response DTO
// In case you fetch something from the Database and want to return a portion of it
// USE THE MAPPER TO MAP THE ENTITY TO A RESPONSE DTO
// Last thing I need is for someone to return a hashed password in the response.

// ! THIS IS AN EXAMPLE DTO
export const AuthResponseDto = extendedZod
  .object({
    id: extendedZod.string(),
    email: extendedZod.string(),
    name: extendedZod.string(),
    role: extendedZod.enum(['user', 'admin']),
  })
  .openapi('AuthResponse', {
    example: {
      id: '697b7c75001e8cb1d4c0bb67',
      email: 'user@example.com',
      name: 'cow',
      role: 'user',
    },
  });

export const UserCredientialsResponseDto = extendedZod
  .object({
    id: extendedZod.string(),
    displayName: extendedZod.string(),
    role: extendedZod.enum(['Listener', 'Artist', 'Pro', 'Admin']),
    profileLink: extendedZod.string(),
    profileImg: extendedZod.object({
      imgLink: extendedZod.string(),
      publicId: extendedZod.string(),
    }),
    subscription: extendedZod.object({
      subscriptionType: extendedZod.string(),
      quota: extendedZod.object({
        unlimited: extendedZod.boolean(),
        usedSeconds: extendedZod.number(),
      }),
    }),
  })
  .openapi('UserCredientialsResponse', {
    example: {},
  });

export type LoginResponse = z.infer<typeof UserCredientialsResponseDto>;
