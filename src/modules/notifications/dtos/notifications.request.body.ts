import extendedZod from '../../../shared/docs/dtoDocumenter';

export const RegisterFcmTokenBodyDTO = extendedZod.object({
  token: extendedZod.string().min(1),
  platform: extendedZod.enum(['ios', 'android']),
});

export const UnregisterFcmTokenBodyDTO = extendedZod.object({
  token: extendedZod.string().min(1),
});
