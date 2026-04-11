import extendedZod from '../../../shared/docs/dtoDocumenter';
import { z } from 'zod';

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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type LoginSession = {
  tokens: AuthTokens;
  userDetails: LoginResponse;
};

export type LoginResponse = z.infer<typeof UserCredientialsResponseDto>;
