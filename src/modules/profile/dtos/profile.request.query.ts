import extendedZod from '../../../shared/docs/dtoDocumenter';

export const CheckProfileLinkParamDTO = extendedZod.object({
  query: extendedZod.object({
    profileLink: extendedZod.string().min(1),
  }),
});
