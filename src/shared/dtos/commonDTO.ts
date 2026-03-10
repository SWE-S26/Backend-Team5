import extendedZod from '../docs/dtoDocumenter';

/** @description - This is used when you want to add pagination for DTOs*/
export const PaginationQueryDto = extendedZod.object({
  page: extendedZod.string().optional(),
  limit: extendedZod.string().optional(),
});

/** @description - This is used when you want to add pagination for DTOs*/
export const idParamDto = extendedZod.object({
  id: extendedZod.mongoId(),
});

// ! remember to use .extend and not merge as merge is deprecated
