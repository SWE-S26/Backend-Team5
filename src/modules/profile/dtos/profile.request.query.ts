import extendedZod from '../../../shared/docs/dtoDocumenter';

export const CheckProfileLinkParamDTO = extendedZod.object({
  query: extendedZod.object({
    username: extendedZod.string().min(1),
  }),
});
