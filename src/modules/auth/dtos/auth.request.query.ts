import extendedZod from '../../../shared/docs/dtoDocumenter';

export const VerifyEmailQueryDto = extendedZod.object({
  token: extendedZod.string(),
});

export const GoogleCallbackQueryDto = extendedZod.object({
  code: extendedZod.string(),
});

export const loginCrossQueryDto = extendedZod.object({
  client: extendedZod.string().optional(),
});
